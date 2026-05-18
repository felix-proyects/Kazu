import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { getAnimeImage } from 'wimages-lib';

const gachaPath = path.resolve('./config/database/gacha/gacha_list.json');
const baseGroup = "120363423871589037@g.us";

const waifuImageCommand = {
    name: 'waifuinfo',
    alias: ['wiinfo', 'winfo'],
    category: 'gacha',
    desc: 'Busca imágenes e info de personajes en la lista interna o en WimagesLib.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {
        try {
            const query = text || args.join(' ');
            if (!query) {
                return m.reply(`*${config.visuals.emoji2}* Ingrese el nombre o ID del personaje.\n\nEjemplo: ${usedPrefix}${commandName} Raphtalia o ${usedPrefix}${commandName} 50`);
            }

            await conn.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

            let characterData = null;

            if (fs.existsSync(gachaPath)) {
                const rawData = JSON.parse(fs.readFileSync(gachaPath, 'utf-8'));
                const plantillaPersonajes = rawData[baseGroup] || {};

                if (plantillaPersonajes[query.trim()]) {
                    const pj = plantillaPersonajes[query.trim()];
                    characterData = {
                        name: pj.name,
                        source: pj.source || pj.anime || 'No especificado',
                        rarity: pj.rarity || 'No especificada',
                        description: pj.description || 'Sin descripción en el gacha.',
                        imageUrl: pj.image || pj.imageUrl || null,
                        isFromGacha: true
                    };
                } else {
                    const searchName = query.toLowerCase().trim();
                    const foundId = Object.keys(plantillaPersonajes).find(id => 
                        plantillaPersonajes[id].name.toLowerCase().includes(searchName)
                    );

                    if (foundId) {
                        const pj = plantillaPersonajes[foundId];
                        characterData = {
                            name: pj.name,
                            source: pj.source || pj.anime || 'No especificado',
                            rarity: pj.rarity || 'No especificada',
                            description: pj.description || 'Sin descripción en el gacha.',
                            imageUrl: pj.image || pj.imageUrl || null,
                            isFromGacha: true
                        };
                    }
                }
            }

            if (!characterData) {
                const libCharacter = await getAnimeImage(query);
                if (libCharacter && (!Array.isArray(libCharacter) || libCharacter.length > 0)) {
                    const data = Array.isArray(libCharacter) ? libCharacter[0] : libCharacter;
                    characterData = {
                        name: data.name,
                        source: data.source || data.anime || 'No especificado',
                        rarity: data.rarity || 'Común',
                        description: data.description || 'Sin descripción',
                        imageUrl: data.imageUrl || data.image || null,
                        isFromGacha: false
                    };
                }
            }

            if (!characterData) {
                await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply(`*${config.visuals.emoji2}* No encontré a "${query}" ni en el gacha ni en la librería.`);
            }

            let txt = `*${config.visuals.emoji3} INFO - CHARACTER*\n\n`;
            txt += `*Nombre:* ${characterData.name || 'Desconocido'}\n`;
            txt += `*Anime:* ${characterData.source || 'No especificado'}\n`;
            txt += `*Rareza:* ${characterData.rarity || 'Común'}\n\n`;
            txt += `*Descripción:* ${characterData.description || 'Sin descripción'}\n\n`;
            txt += `> © Developed by Félix`;

            if (characterData.imageUrl) {
                await conn.sendMessage(m.chat, { 
                    image: { url: characterData.imageUrl }, 
                    caption: txt 
                }, { quoted: m });

                await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            } else {
                return m.reply(txt);
            }

        } catch (e) {
            console.error('Error en waifuinfo:', e);
            await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } });
            m.reply(`*${config.visuals.emoji2}* Error al procesar la información del personaje.`);
        }
    }
};

export default waifuImageCommand;