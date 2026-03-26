FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p uploads/delivery-proofs

ENV NODE_ENV=production

EXPOSE 5050

CMD ["npm", "start"]
