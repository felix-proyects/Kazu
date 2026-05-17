import { config } from '../config.js';
import { database } from '../database.js';
import fs from 'fs';
import path from 'path';

const gachaPath = path.resolve('./config/database/gacha/gacha_list.json');
const baseGroup = "120363423871589037@g.us";

const claimCommand = {
    name: 'claimcharacter',
    alias: ['reclamar', 'c', 'domar'],
    category: 'gacha',
    desc: 'Reclama un personaje disponible en el grupo utilizando tus coins.',
    noPrefix: true,
    isGroup: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            const group = m.chat;
            const userJid = m.sender;
            const ahora = new Date();
            const tiempoEspera = 9 * 60 * 1000;

            let userDb = global.db.data.users[userJid];
            if (!userDb) {
                userDb = await database.getUser(userJid);
            }

            if (!userDb) {
                userDb = { wallet: 0, bank: 0, genre: 'No definido', marry: null, last_claim: '1970-01-01T00:00:00.000Z', last_crime: '1970-01-01T00:00:00.000Z', last_work: '1970-01-01T00:00:00.000Z', last_slut: '1970-01-01T00:00:00.000Z', last_flip: '1970-01-01T00:00:00.000Z', last_rob: '1970-01-01T00:00:00.000Z', last_rw: '1970-01-01T00:00:00.000Z', last_claim_pj: '1970-01-01T00:00:00.000Z' };
            }

            const lastClaimTime = new Date(userDb.last_claim_pj || '1970-01-01T00:00:00.000Z').getTime();
            const tiempoPasado = ahora.getTime() - lastClaimTime;

            if (tiempoPasado < tiempoEspera) {
                const faltante = tiempoEspera - tiempoPasado;
                const minutos = Math.floor(faltante / 60000);
                const segundos = Math.floor((faltante % 60000) / 1000);
                return m.reply(`*${config.visuals.emoji2}* ¡Espera! Debes esperar **${minutos}m ${segundos}s** antes de reclamar otro personaje.`);
            }

            if (!fs.existsSync(gachaPath)) return m.reply('Error: Base de datos gacha no encontrada.');
            const rawData = JSON.parse(fs.readFileSync(gachaPath, 'utf-8'));
            const plantillaPersonajes = rawData[baseGroup];

            let pjId = null;
            if (args && args[0] && !isNaN(args[0])) {
                pjId = args[0];
            } else if (m.quoted) {
                const chatRolls = global.db.data.chats[group]?.rolls;
                if (chatRolls && chatRolls[m.quoted.id]) {
                    if (ahora.getTime() > chatRolls[m.quoted.id].expiresAt) {
                        return m.reply(`*${config.visuals.emoji2}* El tiempo para reclamar este personaje ha expirado.`);
                    }
                    pjId = chatRolls[m.quoted.id].id;
                }
            }

            if (!pjId || !plantillaPersonajes[pjId]) {
                return m.reply(`*${config.visuals.emoji2}* Cita el mensaje del personaje que deseas reclamar o escribe su ID.`);
            }

            const infoPj = await database.getCharacterOwner(group, pjId);
            if (infoPj && infoPj.status !== 'libre') {
                return m.reply(`*${config.visuals.emoji2}* ¡Este personaje ya tiene dueño!`);
            }

            const pjPlantilla = plantillaPersonajes[pjId];
            const wallet = Number(userDb.wallet || 0);

            if (wallet < pjPlantilla.value) {
                return m.reply(`*${config.visuals.emoji2}* No tienes suficiente dinero en tu billetera. Necesitas $${pjPlantilla.value.toLocaleString()} coins.`);
            }

            userDb.wallet = wallet - pjPlantilla.value;
            userDb.last_claim_pj = ahora.toISOString();

            global.db.data.users[userJid] = userDb;

            await database.claimCharacter(group, userJid, pjId);
            await database.saveUser(userJid, userDb);

            return m.reply(`*${config.visuals.emoji3}* ¡Felicidades! Has domado a *${pjPlantilla.name}* por $${pjPlantilla.value.toLocaleString()} coins.`);

        } catch (e) {
            console.error(e);
            m.reply(`*${config.visuals.emoji2}* Error al procesar el reclamo.`);
        }
    }
};

export default claimCommand;