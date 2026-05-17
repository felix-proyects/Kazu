import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { database } from '../database.js';

const gachaPath = path.resolve('./config/database/gacha/gacha_list.json');
const baseGroup = "120363423871589037@g.us";

const buyCommand = {
    name: 'buy',
    alias: ['obtener', 'comprar'],
    category: 'gacha',
    desc: 'Compra personajes puestos en venta por otros usuarios del grupo.',
    noPrefix: true,
    isGroup: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            const group = m.chat;
            const buyerJid = m.sender;
            const pjId = args[0];

            if (!pjId) return m.reply(`*${config.visuals.emoji2}* Indica la ID del personaje que quieres comprar del mercado.`);

            if (!fs.existsSync(gachaPath)) return m.reply(`*${config.visuals.emoji2}* Error: DB Gacha no encontrada.`);
            const rawData = JSON.parse(fs.readFileSync(gachaPath, 'utf-8'));
            const plantillaPersonajes = rawData[baseGroup];

            const shopItems = await database.listShop(group);
            const item = shopItems.find(i => i.character_id === pjId);

            if (!item) {
                return m.reply(`*${config.visuals.emoji2}* El personaje con la ID \`${pjId}\` no se encuentra disponible en el mercado de este grupo.`);
            }

            const sellerJid = item.seller_jid;
            const price = Number(item.sale_price);

            const cleanBuyer = buyerJid.split('@')[0].split(':')[0] + '@s.whatsapp.net';
            const cleanSeller = sellerJid.split('@')[0].split(':')[0] + '@s.whatsapp.net';

            if (cleanBuyer === cleanSeller) {
                return m.reply(`*${config.visuals.emoji2}* No puedes comprar un personaje que tú mismo pusiste en venta.`);
            }

            let buyerDb = global.db.data.users[buyerJid];
            if (!buyerDb) {
                buyerDb = await database.getUser(buyerJid);
            }

            if (!buyerDb || Number(buyerDb.wallet || 0) < price) {
                return m.reply(`*${config.visuals.emoji2}* No tienes suficiente dinero en tu billetera para pagar $${price.toLocaleString()} coins.`);
            }

            const actualSellerJid = await database.buyCharacter(group, buyerJid, pjId, price);

            buyerDb.wallet = Number(buyerDb.wallet) - price;
            global.db.data.users[buyerJid] = buyerDb;

            let sellerDb = global.db.data.users[actualSellerJid];
            if (sellerDb) {
                sellerDb.wallet = Number(sellerDb.wallet || 0) + price;
                global.db.data.users[actualSellerJid] = sellerDb;
            }

            let txt = `*${config.visuals.emoji3} \`COMPRA EXITOSA\` ${config.visuals.emoji3}*\n\n`;
            txt += `» ¡Felicidades! Adquiriste una nueva pieza para tu colección.\n`;
            txt += `*✰ Personaje »* *${item.character_name}*\n`;
            txt += `*✰ Costo total »* $${price.toLocaleString()} coins\n\n`;
            txt += `> ¡Disfruta de tu nuevo personaje en tu #harem!`;

            await m.reply(txt);

            try {
                const sellerCleanId = actualSellerJid.split('@')[0];
                await conn.sendMessage(actualSellerJid, { 
                    text: `*${config.visuals.emoji3} \`AVISO DE VENTA\` ${config.visuals.emoji3}*\n\n» Tu personaje *${item.character_name}* (\`${pjId}\`) fue comprado en el mercado.\n*✰ Ganancia »* +$${price.toLocaleString()} coins en tu billetera.` 
                });
            } catch (err) {
                console.log("No se pudo enviar el mensaje privado al vendedor, probablemente tenga chat cerrado.");
            }

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error al procesar la transacción en el mercado.`);
        }
    }
};

export default buyCommand;