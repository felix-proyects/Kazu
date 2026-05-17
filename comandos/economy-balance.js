import { database } from '../database.js';

const balanceCommand = {
    name: 'balance',
    alias: ['bal', 'wallet', 'banco', 'coins'],
    category: 'economy',
    desc: 'Muestra tu balance actual de coins.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            const user = global.db.data.users[m.sender];

            const wallet = user.wallet || 0;
            const bank = user.bank || 0;
            const total = wallet + bank;

            let txt = `*❁ \`BALANCE DE CUENTA\` ❁*\n\n`;
            txt += `» *Usuario:* @${m.sender.split('@')[0]}\n`;
            txt += `*❀ Billetera »* $${wallet.toLocaleString()} coins\n`;
            txt += `*✿ Banco »* $${bank.toLocaleString()} coins\n`;
            txt += `*✰ Total Neto »* $${total.toLocaleString()} coins\n\n`;
            txt += `> ¡Sigue sumando coins para dominar la economía!`;

            return conn.sendMessage(m.chat, { text: txt, mentions: [m.sender] }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('Ocurrió un error interno al procesar el comando.');
        }
    }
};

export default balanceCommand;