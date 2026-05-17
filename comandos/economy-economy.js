import { database } from '../database.js';

const cdCommand = {
    name: 'economy',
    alias: ['einfo', 'ecoinfo'],
    category: 'economy',
    desc: 'Muestra los tiempos de espera restantes de los comandos de economía.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            let who;
            if (m.isGroup) {
                who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted && m.quoted.sender ? m.quoted.sender : m.sender);
            } else {
                who = m.quoted && m.quoted.sender ? m.quoted.sender : m.sender;
            }

            let user = global.db.data.users[who];
            if (!user) {
                user = await database.getUser(who);
            }

            if (!user) {
                return m.reply('*❁*  El usuario no está registrado en la base de datos.');
            }

            const userId = who.split('@')[0];
            const now = Date.now();

            const formatCooldown = (lastTimeIso, cooldownMs) => {
                if (!lastTimeIso) return '✔ Disponible';
                const lastTime = new Date(lastTimeIso).getTime();
                const difference = now - lastTime;
                if (difference >= cooldownMs) return '✔ Disponible';
                
                const timeLeft = cooldownMs - difference;
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

                let result = '';
                if (hours > 0) result += `${hours}h `;
                if (minutes > 0 || hours > 0) result += `${minutes}m `;
                result += `${seconds}s`;
                return `⏳ ${result}`;
            };

            const dailyFmt = formatCooldown(user.last_claim, 24 * 60 * 60 * 1000);
            const crimeFmt = formatCooldown(user.last_crime, 7 * 60 * 1000);
            const workFmt = formatCooldown(user.last_work, 10 * 60 * 1000);
            const slutFmt = formatCooldown(user.last_slut, 12 * 60 * 1000);

            const wallet = user.wallet || 0;
            const bank = user.bank || 0;
            const totalCoins = wallet + bank;

            let message = `*❁* \`ESTADÍSTICAS GLOBALES\` *❁*\n\n`;
            message += `› @${userId}\n\n`;
            message += `ⴵ Daily » ${dailyFmt}\n`;
            message += `ⴵ Work » ${workFmt}\n`;
            message += `ⴵ Crime » ${crimeFmt}\n`;
            message += `ⴵ Slut » ${slutFmt}\n\n`;
            message += `*⛁* Coins totales » *$${totalCoins.toLocaleString()}*`;

            return conn.sendMessage(m.chat, { text: message, mentions: [who] }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default cdCommand;