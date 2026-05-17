import { database } from '../database.js';
import { config } from '../config.js';
import { crimeFrases, failFrases } from './frases/crimen.js';

const crimeCommand = {
    name: 'crime',
    alias: ['crimen', 'robar'],
    category: 'economy',
    desc: 'Comete un crimen para ganar coins, pero ten cuidado con la policía.',
    noPrefix: true,
    cooldown: 300,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            await conn.sendMessage(m.chat, { react: { text: '🕵️', key: m.key } });

            const user = global.db.data.users[m.sender];
            const chance = Math.random() < 0.65;

            if (chance) {
                const frase = crimeFrases[Math.floor(Math.random() * crimeFrases.length)];
                const reward = Math.floor(Math.random() * (frase.max - frase.min + 1)) + frase.min;

                user.wallet = (user.wallet || 0) + reward;
                await database.saveUser(m.sender, user);

                let txt = `*${config.visuals.emoji1}* ¡CRIMEN EXITOSO! *${config.visuals.emoji1}*\n\n`;
                txt += `*${config.visuals.emoji3}* ${frase.text}\n`;
                txt += `*${config.visuals.emoji3}* Ganancia: *💵 +${reward.toLocaleString()} coins*\n`;
                txt += `*${config.visuals.emoji3}* Cartera actual: *💵 ${user.wallet.toLocaleString()} coins*`;

                await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                return m.reply(txt);
            } else {
                const fraseFallo = failFrases[Math.floor(Math.random() * failFrases.length)];
                const loss = Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;

                user.wallet = Math.max(0, (user.wallet || 0) - loss);
                await database.saveUser(m.sender, user);

                let txt = `*${config.visuals.emoji2}* ¡CRIMEN FALLIDO! *${config.visuals.emoji2}*\n\n`;
                txt += `*${config.visuals.emoji3}* ${fraseFallo}\n`;
                txt += `*${config.visuals.emoji3}* Multa pagada: *💵 -${loss.toLocaleString()} coins*\n`;
                txt += `*${config.visuals.emoji3}* Cartera actual: *💵 ${user.wallet.toLocaleString()} coins*`;

                await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply(txt);
            }

        } catch (e) {
            console.error(e);
            await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } });
            m.reply(`*${config.visuals.emoji2}* Ocurrió un error al planear el crimen.`);
        }
    }
};

export default crimeCommand;