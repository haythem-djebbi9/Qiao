# Image de production QIAO : compile le site React et l'API NestJS ; l'API sert le site et répond sous /api.
FROM node:20.19-bookworm-slim AS build
WORKDIR /app
COPY Frontend/package.json Frontend/package-lock.json Frontend/
COPY Backend/package.json Backend/package-lock.json Backend/
RUN npm ci --include=dev --prefix Frontend && npm ci --include=dev --prefix Backend
COPY Frontend Frontend
COPY Backend Backend
RUN npm run build --prefix Frontend && npm run build --prefix Backend
RUN npm prune --omit=dev --prefix Backend

FROM node:20.19-bookworm-slim
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app
COPY --from=build /app/Frontend/dist Frontend/dist
COPY --from=build /app/Backend/dist Backend/dist
COPY --from=build /app/Backend/node_modules Backend/node_modules
COPY --from=build /app/Backend/package.json Backend/package.json
COPY --from=build /app/Backend/scripts/deploy Backend/scripts/deploy
# Dossier des fichiers téléversés : monté sur un volume persistant, accessible à l'utilisateur non root.
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "Backend/dist/main.js"]
