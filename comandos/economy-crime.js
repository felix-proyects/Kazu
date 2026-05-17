import { database } from '../database.js';
import { crimeFrases, failFrases } from './frases/crimen.js';

const crimeCommand = {
    name: 'crime',
    alias: ['crimen', 'robar'],
    category: 'economy',
    desc: 'Comete un crimen para ganar coins.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            const user = global.db.data.users[m.sender];
            const now = Date.now();
            const cooldownTime = 7 * 60 * 1000;
            const lastCrime = user.last_crime_time || 0;

            if (now - lastCrime < cooldownTime) {
                const timeLeft = cooldownTime - (now - lastCrime);
                const minutes = Math.floor(timeLeft / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                return m.reply(`*❁ ¡ESPERA UN MOMENTO! ❁*\n\n» Debes esperar *${minutes}m ${seconds}s* antes de cometer otro crimen.`);
            }

            const chance = Math.random() < 0.65;

            if (chance) {
                const frase = crimeFrases[Math.floor(Math.random() * crimeFrases.length)];
                const reward = Math.floor(Math.random() * (frase.max - frase.min + 1)) + frase.min;

                user.wallet = (user.wallet || 0) + reward;
                user.last_crime_time = now;
                await database.saveUser(m.sender, user);

                let txt = `*❁ \`CRIMEN EXITOSO\` ❁*\n\n`;
                txt += `» ${frase.text}\n`;
                txt += `*✰ Ganaste »* 💵 ${reward.toLocaleString()} coins\n\n`;
                txt += `> ¡Escapa antes de que la policía te atrapé!`;

                return m.reply(txt);
            } else {
                const fraseFallo = failFrases[Math.floor(Math.random() * failFrases.length)];
                const loss = Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;

                user.wallet = Math.max(0, (user.wallet || 0) - loss);
                user.last_crime_time = now;
                await database.saveUser(m.sender, user);

                let txt = `*❁ \`CRIMEN FALLIDO\` ❁*\n\n`;
                txt += `» ${fraseFallo}\n`;
                txt += `*✰ Perdiste »* 💵 ${loss.toLocaleString()} coins\n\n`;
                txt += `> ¡Te han atrapado y tuviste que pagar la fianza!`;

                return m.reply(txt);
            }

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default crimeCommand;