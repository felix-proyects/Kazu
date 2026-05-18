import { database } from '../database.js';

export default async function antiLinkHandler(conn, m) {
    if (!m.chat.endsWith('@g.us')) return;

    const dbChat = await database.getChat(m.chat);
    if (dbChat && dbChat.antilink === 0) return;

    const body = (
        m.message?.conversation || 
        m.message?.extendedTextMessage?.text || 
        m.message?.imageMessage?.caption || 
        m.message?.videoMessage?.caption || ""
    ).trim();

    const forbiddenLinks = [
        'web.whatsapp.com',
        'chat.whatsapp.com',
        'whatsapp.com/channel/',
        'api.whatsapp.com/send/',
        'whatsapp.com'
    ];

    const containsForbidden = forbiddenLinks.some(link => {
        const regex = new RegExp(link.replace('.', '\\.'), 'i');
        return regex.test(body);
    });

    if (containsForbidden) {
        const { isAdmin, isBotAdmin } = await conn.getAdminStatus(m.chat, m.sender);

        if (isAdmin) return;
        if (!isBotAdmin) return;

        const userNumber = m.sender.split('@')[0].split(':')[0];
        const metadata = await conn.groupMetadata(m.chat).catch(() => null);
        const participants = metadata ? metadata.participants.map(p => p.id) : [];

        await conn.sendMessage(m.chat, { delete: m.key });
        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');

        let txt = `*✿︎ \`ANTILINK DETECTED\` ✿︎*\n\n`;
        txt += `» Se ha eliminado a @${userNumber} por enviar un link no permitido.\n\n`;
        txt += `> ✰ ¡En este grupo no se permiten enlaces externos!`;

        await conn.sendMessage(m.chat, { 
            text: txt, 
            mentions: [...participants, m.sender] 
        });
    }
}