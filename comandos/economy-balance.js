import { config } from '../config.js';

const balanceCommand = {
    name: 'balance',
    alias: ['bal', 'cartera', 'banco', 'coins'],
    category: 'economy',
    desc: 'Muestra tu saldo actual en la cartera, el banco y el total acumulado.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            await conn.sendMessage(m.chat, { react: { text: '💳', key: m.key } });

            const user = global.db.data.users[m.sender];
            const wallet = user.wallet || 0;
            const bank = user.bank || 0;
            const total = wallet + bank;

            let txt = `*${config.visuals.emoji1}* BALANCE DE USUARIO *${config.visuals.emoji1}*\n\n`;
            txt += `*${config.visuals.emoji3}* Usuario: @${m.sender.split('@')[0]}\n`;
            txt += `*${config.visuals.emoji3}* En Cartera: *💵 ${wallet.toLocaleString()} coins*\n`;
            txt += `*${config.visuals.emoji3}* En el Banco: *🏛️ ${bank.toLocaleString()} coins*\n\n`;
            txt += `*${config.visuals.emoji3}* Total Neto: *💰 ${total.toLocaleString()} coins*`;

            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            return conn.sendMessage(m.chat, { text: txt, mentions: [m.sender] }, { quoted: m });

        } catch (e) {
            console.error(e);
            await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } });
            m.reply(`*${config.visuals.emoji2}* Ocurrió un error al verificar tu balance.`);
        }
    }
};

export default balanceCommand;