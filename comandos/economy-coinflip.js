import { database } from '../database.js';
import { flipFrases } from './frases/flip.js';

const flipCommand = {
    name: 'flip',
    alias: ['coinflip', 'moneda', 'suerte'],
    category: 'economy',
    desc: 'Apuesta tus coins a cara o cruz con un 30% de probabilidad de ganar el doble.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            const user = global.db.data.users[m.sender];
            const wallet = user.wallet || 0;
            const now = new Date();
            const lastFlip = new Date(user.last_flip || '1970-01-01T00:00:00.000Z');

            const difference = now - lastFlip;
            const cooldownTime = 15 * 1000;

            if (difference < cooldownTime) {
                const timeLeft = ((cooldownTime - difference) / 1000).toFixed(1);
                return m.reply(`*❁ ¡ESPERA UN MOMENTO! ❁*\n\n» Debes esperar *${timeLeft}s* antes de lanzar la moneda otra vez.`);
            }

            if (!args[0]) {
                return m.reply(`*❁ ¡ERROR DE USO! ❁*\n\n» Especifica una cantidad para apostar o escribe *all*.\n» Ejemplo: *${usedPrefix || ''}${commandName} 5000*`);
            }

            let amount;
            if (args[0].toLowerCase() === 'all') {
                amount = wallet;
            } else {
                amount = parseInt(args[0].replace(/[^0-9]/g, ''));
            }

            if (isNaN(amount) || amount <= 0) {
                return m.reply(`*❁ ¡CANTIDAD INVÁLIDA! ❁*\n\n» Ingresa un número entero mayor a cero para realizar la apuesta.`);
            }

            if (wallet < amount) {
                return m.reply(`*❁ \`FONDOS INSUFICIENTES\` ❁*\n\n» No tienes suficientes coins en tu billetera.\n» Dispones de: *$${wallet.toLocaleString()}* coins.`);
            }

            user.last_flip = now.toISOString();

            const winChance = Math.random() < 0.30;

            if (winChance) {
                const frase = flipFrases.win[Math.floor(Math.random() * flipFrases.win.length)];
                
                user.wallet = wallet + amount;
                await database.saveUser(m.sender, user);

                let txt = `*❁ \`APUESTA EXITOSA\` ❁*\n\n`;
                txt += `» ${frase}\n`;
                txt += `*✰ Ganaste »* $${amount.toLocaleString()} coins\n`;
                txt += `*❀ Total Billetera »* $${user.wallet.toLocaleString()} coins\n\n`;
                txt += `> ✿ ¡La fortuna te acompaña el día de hoy!`;

                return m.reply(txt);
            } else {
                const fraseFallo = flipFrases.lose[Math.floor(Math.random() * flipFrases.lose.length)];
                
                user.wallet = Math.max(0, wallet - amount);
                await database.saveUser(m.sender, user);

                let txt = `*❁ \`APUESTA FALLIDA\` ❁*\n\n`;
                txt += `» ${fraseFallo}\n`;
                txt += `*✰ Perdiste »* $${amount.toLocaleString()} coins\n`;
                txt += `*❀ Total Billetera »* $${user.wallet.toLocaleString()} coins\n\n`;
                txt += `> ✰ La suerte es caprichosa, vuelve a intentarlo.`;

                return m.reply(txt);
            }

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default flipCommand;