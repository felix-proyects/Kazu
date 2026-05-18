import { config } from '../config.js';
import { database } from '../database.js';

const setAge = {
    name: 'setage',
    alias: ['estableceredad', 'miedad'],
    category: 'profile',
    desc: 'Registra tu edad en tu perfil.',
    noPrefix: true,

    run: async (conn, m, args) => {
        try {
            const edadInput = args[0];

            if (!edadInput) {
                return m.reply(`*${config.visuals.emoji2} \`FALTA EDAD\` ${config.visuals.emoji2}*\n\nIngresa tu edad después del comando.\n\n» Ejemplo: *setage 19*`);
            }

            const edad = parseInt(edadInput.replace(/[^0-9]/g, ''));

            if (isNaN(edad) || edad <= 0 || edad > 100) {
                return m.reply(`*${config.visuals.emoji2} \`EDAD INVÁLIDA\` ${config.visuals.emoji2}*\n\nIngresa un número de edad lógico y válido.`);
            }

            let userDb = await database.getUser(m.sender);
            if (!userDb) {
                userDb = { wallet: 0, bank: 0, genre: 'No definido', marry: null, birthday: null };
            }

            let currentBirthdayData = { age: null, date: 'No definido' };

            if (userDb.birthday) {
                try {
                    currentBirthdayData = typeof userDb.birthday === 'string' ? JSON.parse(userDb.birthday) : userDb.birthday;
                } catch (e) {
                    currentBirthdayData = { age: null, date: 'No definido' };
                }
            }

            currentBirthdayData.age = edad;

            userDb.birthday = JSON.stringify(currentBirthdayData);
            await database.saveUser(m.sender, userDb);

            m.reply(`*${config.visuals.emoji3} \`EDAD REGISTRADA\` ${config.visuals.emoji3}*\n\nTu edad se ha guardado correctamente.\n\n*❁ Edad:* \`${edad} años\``);

        } catch (e) {
            console.error(e);
            m.reply('✘ Error al guardar la edad.');
        }
    }
};

export default setAge;