# Étape 1 : Utiliser une image de base officielle
FROM nginx:alpine

# Étape 2 : Supprimer les fichiers HTML par défaut de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Étape 3 : Copier ton site HTML/CSS dans le dossier utilisé par Nginx
COPY . /usr/share/nginx/html

# Étape 4 : Exposer le port 80 (utilisé par Nginx)
EXPOSE 80

# Étape 5 : Démarrer Nginx quand le conteneur s’exécute
CMD ["nginx", "-g", "daemon off;"]
