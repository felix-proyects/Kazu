import { database } from '../database.js';
import { config } from '../config.js';

const dailyCommand = {
    name: 'daily',
    alias: ['diario', 'claim', 'recompensa'],
    category: 'economy',
    desc: 'Reclama tu recompensa diaria con multiplicador por racha de días.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            await conn.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

            const user = global.db.data.users[m.sender];
            const now = new Date();
            const lastClaim = new Date(user.last_claim || '1970-01-01T00:00:00.000Z');

            const difference = now - lastClaim;
            const oneDay = 24 * 60 * 60 * 1000;
            const twoDays = 48 * 60 * 60 * 1000;

            if (difference < oneDay) {
                const timeLeft = oneDay - difference;
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                
                await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply(`*${config.visuals.emoji2}* Ya has reclamado tu recompensa del día de hoy.\n\nRegresa en: *${hours}h ${minutes}m*`);
            }

            if (!user.streak || difference >= twoDays) {
                user.streak = 1;
            } else {
                user.streak += 1;
            }

            const baseReward = 35000;
            const increment = 10000;
            const finalReward = baseReward + ((user.streak - 1) * increment);

            user.wallet = (user.wallet || 0) + finalReward;
            user.last_claim = now.toISOString();

            await database.saveUser(m.sender, user);

            let txt = `*${config.visuals.emoji1}* ¡RECOMPENSA DIARIA RECLAMADA! *${config.visuals.emoji1}*\n\n`;
            txt += `*${config.visuals.emoji3}* Has ganado: *💵 ${finalReward.toLocaleString()} coins*\n`;
            txt += `*${config.visuals.emoji3}* Racha actual: *🔥 ${user.streak} día(s) consecutivo(s)*\n`;
            txt += `*${config.visuals.emoji3}* Tu cartera actual: *💵 ${user.wallet.toLocaleString()} coins*\n\n`;
            txt += `Sigue reclamando mañana para obtener *💵 ${(finalReward + increment).toLocaleString()} coins*.`;

            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            return m.reply(txt);

        } catch (e) {
            console.error(e);
            await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } });
            m.reply(`*${config.visuals.emoji2}* Ocurrió un error interno al procesar tu recompensa.`);
        }
    }
};

export default dailyCommand;