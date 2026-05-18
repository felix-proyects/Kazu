import { config } from '../config.js';
import { database } from '../database.js';

const addCoins = {
    name: 'addcoins',
    alias: ['darcoins', 'regalarcoins', 'givemoney'],
    category: 'owner',
    desc: 'Suma monedas directamente al banco de un usuario.',
    isOwner: true,
    noPrefix: true,

    run: async (conn, m, args) => {
        try {
            const realOwnerNumber = (typeof config.owner[0] === 'string' ? config.owner[0] : config.owner[0][0]).replace(/\D/g, '');
            const senderNumber = m.sender.split('@')[0].replace(/\D/g, '');

            if (senderNumber !== realOwnerNumber) {
                return m.reply(`*${config.visuals.emoji2}* \`ACCESO DENEGADO\` *${config.visuals.emoji2}*\n\nEste comando solo puede ser ejecutado por mi creador o personas autorizadas.`);
            }

            let rawTarget = m.quoted ? m.quoted.sender || m.quoted.key.participant || m.quoted.key.remoteJid : m.mentionedJid?.[0];

            if (!rawTarget) {
                return m.reply(`*${config.visuals.emoji2}* \`Falta Usuario\` *${config.visuals.emoji2}*\n\nMenciona a alguien o responde a su mensaje.`);
            }

            const targetJid = rawTarget.split('@')[0].split(':')[0].trim() + '@s.whatsapp.net';
            const monto = parseInt(args.find(arg => !isNaN(arg) && !arg.includes('@')));

            if (!monto || monto <= 0) {
                return m.reply(`*${config.visuals.emoji2}* \`Monto Inválido\` *${config.visuals.emoji2}*\n\nIngresa una cantidad válida.`);
            }

            let userDb = await database.getUser(targetJid);
            if (!userDb) {
                userDb = { wallet: 0, bank: 0, genre: 'No definido', marry: null };
            }

            userDb.bank = (userDb.bank || 0) + monto;
            await database.saveUser(targetJid, userDb);

            const userId = targetJid.split('@')[0];

            const texto = `*${config.visuals.emoji3}* \`MONEDAS ENVIADAS\` *${config.visuals.emoji3}*\n\n*❁ Usuario:* @${userId}\n*❁ Cantidad:* \`¥${monto.toLocaleString()}\`\n*❁ Destino:* \`Banco\`\n\n> El dinero ha sido sumado con éxito a la cuenta global del usuario.`;

            await conn.sendMessage(m.chat, { 
                text: texto, 
                mentions: [targetJid] 
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error interno.`);
        }
    }
};

export default addCoins;