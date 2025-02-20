FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
 
RUN rm -rf /app/node_modules
 
RUN npm install
 
CMD ["npm", "start"]