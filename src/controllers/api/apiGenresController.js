const {Op} = require("sequelize");
const db = require('../../database/models');
const {createError}= require('../../helpers');

module.exports = {
    list: async (req, res) => {
        let {limit, order = 'id'} = req.query
        // let fields = ['name', 'ranking'] // campos que quiero traer
        
        try {

            // if(!fields.includes(order)){
            //     throw createError(400, "Solo se ordenan por los campos 'name' o 'ranking'");
            // };

            let total = await db.Genre.count()  // count devuelve una cantidad
            let genres = await db.Genre.findAll({
                attributes:
                {
                    exclude: ['created_at', 'updated_at']
                },
                limit : limit ? +limit : 5,
                order : [order] // coloca por order alfabetico la lista  
            });
            return res.status(200).json({
                ok: true,
                meta: {
                   status : 200
                },
                data: {
                    items : genres.length,
                    total,
                    genres
                }
            });
        } catch (error) {
            console.log(error)
            
            return res.status(error.status || 500).json({ // respuesta al cliente
                ok: false,
                msg: error.message
            })
        }
    },
    getById: async (req, res) => {
        const {id} = req.params;
        try {
            //  creo el error 
            // if((!isNaN)(id)){
            //     error.status(400, 'El Id debe ser un número');
            // }
            let genre = await db.Genre.findByPk(id);
             // validación
            if(!genre){
                 // cuando no encuentra el id del género
                let error = new Error('No se encuentre un género con ese ID');
                error.status = 404;
                // arrojo el error
                throw error
            }
            // si se encuntra el género envia una respuesta
            return res.status(200).json({
                    ok: true,
                    meta: {
                        status : 200
                    },
                    data: {
                        genre,
                        total : 1
                    }
                })
        } catch (error) {
            console.log(error)
            return res.status(error.status || 500).json({
                ok: false,
                msg: error.message,
            })
        }
    },
    getByName : async(req,res) =>{
        const {name} = req.params;
        try {
            if(!name){
                throw createError(400, 'El nombre es obligatorio');
            }
            let genre = await db.Genre.findOne({
                where : {
                    name: {
                        // comodines de sql %
                        [Op.substring] : name
                    }
                }
            });
            if(!genre){
                throw createError(404, "No se encuentra un genero con ese nombre")
            }
            return res.status(200).json({
                ok: true,
                meta: {
                    status : 200
                },
                data: {
                    genre,
                    total : 1
                }
            })

            
        } catch (error) {
            console.log(error)
            return res.status(error.status || 500).json({
                ok: false,
                msg: error.message,
            });
        }
    }
};


