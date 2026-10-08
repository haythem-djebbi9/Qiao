import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { ComputeSimulationDto, QuoteRequestDto } from './simulations.dto';
import { CustomsTariff, FreightRate, ImportSimulation, SimulationResult } from './simulation.entities';

const INSURANCE_RATE = 0.006;

@Injectable()
export class SimulationsService {
  constructor(
    @InjectRepository(CustomsTariff) private readonly tariffs: Repository<CustomsTariff>,
    @InjectRepository(FreightRate) private readonly freight: Repository<FreightRate>,
    @InjectRepository(ImportSimulation) private readonly simulations: Repository<ImportSimulation>,
    private readonly notifications: NotificationsService,
  ) {}

  /** Grille complète, utilisée par le simulateur pour un calcul instantané côté navigateur. */
  async rates() {
    const [tariffs, freight] = await Promise.all([
      this.tariffs.find({ order: { country: 'ASC', category: 'ASC' } }),
      this.freight.find({ order: { country: 'ASC', mode: 'ASC' } }),
    ]);
    return { tariffs, freight, insuranceRate: INSURANCE_RATE };
  }

  async compute(dto: ComputeSimulationDto): Promise<SimulationResult> {
    const tariff = await this.tariffs.findOne({ where: { country: dto.destCountry, category: dto.category } });
    const mode = dto.shippingMode === 'air' ? 'air' : `sea-${dto.containerType}`;
    const freight = await this.freight.findOne({ where: { country: dto.destCountry, mode } });
    if (!tariff || !freight) {
      throw new NotFoundException('Aucun tarif disponible pour cette combinaison.');
    }

    const insuranceCost = Math.round(dto.fobValue * INSURANCE_RATE);
    const cifValue = dto.fobValue + freight.cost + insuranceCost;
    const dutyAmount = Math.round(cifValue * tariff.dutyRate);
    const vatAmount = Math.round((cifValue + dutyAmount) * tariff.vatRate);
    const totalLandedCost = cifValue + dutyAmount + vatAmount + tariff.portFees;

    return {
      customsDutyRate: Math.round(tariff.dutyRate * 1000) / 10,
      vatRate: Math.round(tariff.vatRate * 1000) / 10,
      freightCost: freight.cost,
      insuranceCost,
      cifValue,
      dutyAmount,
      vatAmount,
      portFees: tariff.portFees,
      totalLandedCost,
      transitTime: freight.transitTime,
      port: tariff.port,
    };
  }

  async requestQuote(dto: QuoteRequestDto, user: User | null) {
    const result = await this.compute(dto);
    const count = await this.simulations.count({ where: { quoteRequested: true } });
    const simulation = await this.simulations.save(
      this.simulations.create({
        destCountry: dto.destCountry,
        category: dto.category,
        fobValue: dto.fobValue,
        shippingMode: dto.shippingMode,
        containerType: dto.containerType,
        result,
        quoteRequested: true,
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        notes: dto.notes?.trim() || null,
        reference: `COT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
        user: user ? ({ id: user.id } as User) : null,
      }),
    );

    await this.notifications.notify(
      user,
      `Demande de cotation ${simulation.reference}`,
      `Import vers ${dto.destCountry} — estimation ${result.totalLandedCost.toLocaleString('fr-FR')} USD. Un transitaire certifié vous envoie une cotation ferme sous 24h.`,
      'info',
      'dashboard',
    );
    return { id: simulation.id, reference: simulation.reference, result };
  }

  listForUser(user: User) {
    return this.simulations.find({
      where: [{ user: { id: user.id } }, { email: user.email }],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
