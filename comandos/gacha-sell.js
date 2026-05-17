import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { database } from '../database.js';

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

            // Sanitizar el precio eliminando signos, comas y puntos (Ej: 12,000 -> 12000)
            precioRaw = precioRaw.replace(/[\$,\.]/g, '');
            const price = parseInt(precioRaw);

            if (isNaN(price) || price <= 0) {
                return m.reply(`*${config.visuals.emoji2}* Por favor, ingresa un precio numérico que sea válido.`);
            }

            if (!fs.existsSync(gachaPath)) return m.reply(`*${config.visuals.emoji2}* Error: DB Gacha no encontrada.`);
            const rawData = JSON.parse(fs.readFileSync(gachaPath, 'utf-8'));
            const plantillaPersonajes = rawData[baseGroup];

            if (!plantillaPersonajes[pjId]) {
                return m.reply(`*${config.visuals.emoji2}* El personaje con ID \`${pjId}\` no existe en la plantilla.`);
            }

            // Consultar el dueño actual directo en SQLite
            const infoPj = await database.getCharacterOwner(group, pjId);
            
            // Formatear las JID tal cual lo hace tu función interna normalizeJid
            const rawUser = userJid.split('@')[0].split(':')[0].trim() + '@s.whatsapp.net';
            const rawOwner = infoPj?.user_jid ? infoPj.user_jid.split('@')[0].split(':')[0].trim() + '@s.whatsapp.net' : null;

            if (!infoPj || rawOwner !== rawUser) {
                return m.reply(`*${config.visuals.emoji2}* ¡Este personaje no te pertenece o no está en tu colección!`);
            }

            // Verificar si ya se encuentra en la tienda para evitar el crash del INSERT repetido
            const tiendaActual = await database.listShop(group);
            const yaEstaEnTienda = tiendaActual.some(item => item.character_id === pjId);

            if (infoPj.status === 'en_venta' || yaEstaEnTienda) {
                return m.reply(`*${config.visuals.emoji2}* Este personaje ya se encuentra publicado en el mercado.`);
            }

            const pjPlantilla = plantillaPersonajes[pjId];
            const minPrice = (pjPlantilla.value || 0) + 1000;

            if (price < minPrice) {
                return m.reply(`*${config.visuals.emoji2}* El precio mínimo de venta para este personaje es de *$${minPrice.toLocaleString()}* coins.`);
            }

            // Ejecutar la transacción segura de tu base de datos
            await database.listCharacter(group, userJid, pjId, pjPlantilla.name, price);

            let txt = `*${config.visuals.emoji3} \`MERCADO PÚBLICO\` ${config.visuals.emoji3}*\n\n`;
            txt += `» Has puesto en venta a *${pjPlantilla.name}* correctamente.\n`;
            txt += `*✰ Precio fijado »* $${price.toLocaleString()} coins\n`;
            txt += `*✰ ID Único »* \`${pjId}\`\n\n`;
            txt += `> ¡Esperemos que algún coleccionista se interese en tu oferta!`;

            return m.reply(txt);

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error interno al procesar la venta en la base de datos.`);
        }
    }
};

export default sellCommand;