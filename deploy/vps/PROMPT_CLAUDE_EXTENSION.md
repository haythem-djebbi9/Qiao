# Prompt à donner à l'extension Claude (Chrome)

Ouvrez hPanel dans Chrome, connecté au compte qui gère le VPS, puis collez le texte ci-dessous dans l'extension.

---

Déploie l'application QIAO sur mon VPS Hostinger. Je t'autorise à faire les actions décrites ici, et seulement celles-là.

**Contexte**
- hPanel : https://hpanel.hostinger.com (je suis déjà connecté)
- VPS : srv2109763.hstgr.cloud, IP 2.24.50.90, page https://hpanel.hostinger.com/vps/2109763/overview
- Domaine : qiao-china.io
- Code : https://github.com/haythem-djebbi9/Qiao (branche main)

**Règles**
- Ne saisis jamais de mot de passe, de clé ni de code de validation. Si un écran en demande un, arrête-toi et demande-moi de le saisir.
- N'affiche jamais le contenu de `/root/qiao-comptes.txt` ni de `/opt/qiao/deploy/vps/.env`.
- Dans hPanel, ne fais rien d'autre : pas d'achat ni de mise à niveau, pas de changement de mot de passe, pas de réinstallation du VPS, pas de règle de pare-feu Hostinger, aucun autre domaine ni serveur.
- En cas d'erreur, ne tente pas de correction : montre-moi les 30 dernières lignes de `/root/qiao-install.log` et demande-moi quoi faire.

**Étape 1 : DNS**
1. hPanel › Domaines › qiao-china.io › DNS.
2. Note les enregistrements actuels et montre-les-moi.
3. Supprime uniquement les enregistrements A, AAAA, ALIAS et CNAME dont le nom est `@` ou `www` (page de parking). Ne touche pas aux MX ni aux TXT.
4. Ajoute : type A, nom `@`, valeur `2.24.50.90` ; type A, nom `www`, valeur `2.24.50.90`.
5. Enregistre, puis vérifie que les deux enregistrements apparaissent.

**Étape 2 : installation**
1. Sur la page du VPS, ouvre « Web console ». Si elle demande un mot de passe, arrête-toi et demande-moi de le saisir.
2. Tape cette commande sur une seule ligne, puis Entrée :

```
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a; apt-get -o DPkg::Lock::Timeout=300 update -y; apt-get -o DPkg::Lock::Timeout=300 install -y git; git clone https://github.com/haythem-djebbi9/Qiao.git /opt/qiao; nohup bash /opt/qiao/deploy/vps/install.sh qiao-china.io admin@qiao-china.io > /root/qiao-install.log 2>&1 &
```

3. L'installation dure 5 à 15 minutes et continue même si la console se déconnecte. Toutes les 2 minutes environ, tape `tail -n 8 /root/qiao-install.log` jusqu'à voir la dernière ligne « Comptes créés » ou le mot « ERREUR ». Si la console se déconnecte, rouvre-la et continue.

**Étape 3 : vérification**
1. Ouvre https://qiao-china.io/api/health : la page doit afficher `"status":"ok"` et `"database":"up"`. Si le certificat HTTPS n'est pas encore prêt, réessaie toutes les 5 minutes, pendant 30 minutes au maximum.
2. Ouvre https://qiao-china.io : le site doit s'afficher, et l'onglet Academy aussi.
3. Vérifie `http://www.qiao-china.io` : il doit rediriger vers https://qiao-china.io.

**Étape 4 : comptes**

Le script a créé les comptes, avec des mots de passe aléatoires. Vérifie-les sans afficher les mots de passe :

```
cut -d'|' -f1,2 /root/qiao-comptes.txt
```

Tu dois voir l'administrateur (`admin@qiao-china.io`), le client de test (`client.test@qiao-china.io`) et l'expert de test (`expert.test@qiao-china.io`). Ne te connecte pas à ces comptes.

**Compte rendu**

Donne-moi : les enregistrements DNS avant et après, le résultat de `/api/health`, la liste des comptes (sans mot de passe), et tout ce qui n'a pas marché. Termine par cette consigne : « Pour voir les mots de passe, tapez vous-même `cat /root/qiao-comptes.txt` dans la console web, notez-les, puis supprimez le fichier avec `rm /root/qiao-comptes.txt`. »
