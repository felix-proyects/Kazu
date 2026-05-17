import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { database, query } from '../database.js';

const gachaPath = path.resolve('./config/database/gacha/gacha_list.json');
const baseGroup = "120363423871589037@g.us";

const sellCommand = {
    name: 'sell',
    alias: ['vender'],
    category: 'gacha',
    desc: 'Pon uno de tus personajes en el mercado del grupo para que otros puedan comprarlo.',
    noPrefix: true,
    isGroup: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            const group = m.chat;
            const userJid = m.sender;
            const pjId = args[0];
            let precioRaw = args[1];

            if (!pjId || !precioRaw) {
                return m.reply(`*${config.visuals.emoji2}* \`Uso Incorrecto\`\n• Usa el comando de la siguiente manera:\n> .sell (ID) (Precio)`);
            }

            // Limpiar formato de precio (Ej: 12,000 -> 12000)
            precioRaw = precioRaw.replace(/[\$,\.]/g, '');
            const price = parseInt(precioRaw);

            if (isNaN(price) || price <= 0) {
                return m.reply(`*${config.visuals.emoji2}* Por favor, ingresa un precio numérico válido.`);
            }

            if (!fs.existsSync(gachaPath)) return m.reply(`*${config.visuals.emoji2}* Error: DB Gacha no encontrada.`);
            const rawData = JSON.parse(fs.readFileSync(gachaPath, 'utf-8'));
            const plantillaPersonajes = rawData[baseGroup];

            if (!plantillaPersonajes[pjId]) {
                return m.reply(`*${config.visuals.emoji2}* El personaje con ID \`${pjId}\` no existe.`);
            }

            // Obtener el dueño actual
            const infoPj = await database.getCharacterOwner(group, pjId);
            
            // Normalización idéntica a la interna de la DB
            const rawUser = userJid.split('@')[0].split(':')[0].trim() + '@s.whatsapp.net';
            const rawOwner = infoPj?.user_jid ? infoPj.user_jid.split('@')[0].split(':')[0].trim() + '@s.whatsapp.net' : null;

            if (!infoPj || rawOwner !== rawUser) {
                return m.reply(`*${config.visuals.emoji2}* ¡Este personaje no te pertenece o no está en tu colección!`);
            }

            const pjPlantilla = plantillaPersonajes[pjId];
            const minPrice = (pjPlantilla.value || 0) + 1000;

            if (price < minPrice) {
                return m.reply(`*${config.visuals.emoji2}* El precio mínimo de venta para este personaje es *$${minPrice.toLocaleString()}* coins.`);
            }

            // Bypass de la transacción tradicional usando INSERT OR REPLACE directo a la DB
            // Evita el error de clave duplicada y actualiza el estado del harem de forma segura
            await query(`
                INSERT OR REPLACE INTO gacha_shop (group_jid, seller_jid, character_id, character_name, sale_price) 
                VALUES (?, ?, ?, ?, ?)
            `, [group, rawUser, pjId, pjPlantilla.name, price]);

            await query(`
                UPDATE gacha_ownership 
                SET status = 'en_venta' 
                WHERE group_jid = ? AND character_id = ?
            `, [group, pjId]);

            let txt = `*${config.visuals.emoji3} \`MERCADO PÚBLICO\` ${config.visuals.emoji3}*\n\n`;
            txt += `» Has puesto en venta a *${pjPlantilla.name}* correctamente.\n`;
            txt += `*✰ Precio fijado »* $${price.toLocaleString()} coins\n`;
            txt += `*✰ ID Único »* \`${pjId}\`\n\n`;
            txt += `> ¡Esperemos que algún coleccionista se interese en tu oferta!`;

            return m.reply(txt);

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error al procesar el reclamo en la base de datos.`);
        }
    }
};

export default sellCommand;