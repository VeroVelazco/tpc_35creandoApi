const path = require('path');
const db = require("../../database/models");
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require('moment');
const {createError, getUrl, getUrlBase}= require('../../helpers/index');
// const { errorMonitor } = require('events');


//Aqui tienen otra forma de llamar a cada uno de los modelos
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;


const moviesController = {
    list: async (req, res) => {
        const {limit, order , search, offset} = req.query;
        let fields = ['title','rating' ,'release_date', 'awards', 'length'];

        try {
            // si viene order y esta incluido en la lista
            if(order && !fields.includes(order)){  
                throw createError(400,`Solo se orderna por los campos ${fields.join(', ')}`);
            };
            
            let total = await db.Movie.count() // count devuelve una cantidad
            let movies = await db.Movie.findAll({
                attributes: {
                    exclude: ['created_at', 'updated_at']
                },
                include : [
                    {
                        association: 'genre', // devuelvo los géneros y les quito atributos
                        attributes : {
                            exclude : ['created_at', 'updated_at']
                        }
                    },
                    {
                        association: 'actors',
                        attributes : {
                            exclude : ['created_at', 'updated_at']
                        },
                    },
                ],
                limit : limit? +limit : 5,
                offset: offset? +offset :0,   // traigo las paginas
                order : [order? order : 'id']
            });

            // recorro movies
            movies.forEach(movie => {
                movie.setDataValue('link',`${getUrl(req)}/${movie.id}`) //voy a agregar un nuevo dato a cada elemento (url)
            });



            return res.status(200).json({
                ok: true,
                meta: {
                    status: 200
                },
                data: {
                    items : movies.length,
                    total,
                    movies  // le agrego una nueva propiedad
                }
            })
        } catch (error) {
            console.log(error)
            return res.status(error.status || 500).json({  // respuesta al cliente
                ok: false,
                status : error.status || 500,
                msg: error.message
            });
        }
    },
    getById: async (req, res) => {
        const {id} = req.params
        try {

            if(isNaN(id)){
                throw createError(400,'El ID debe ser un número') // primero trigo el errror
            };
            
            let movie = await db.Movie.findByPk(req.params.id,
                {
                    include : [
                        {
                            association : 'genre',
                            attributes : {
                                exclude : ['created_at', 'update_at' ]
                            }
                        },
                        {
                            association: 'actors',
                            attributes : {
                                exclude : ['created_at', 'updated_at']
                            },
                        },
                    ],
                    attributes : {
                        exclude : ['created_at', 'updated_at', 'genre_id']
                    }
                });

            if(!movie){
                throw createError(404,'No existe una película con ese ID') // primero trigo el errror
            };

            movie.release_date = moment(movie.release_date).format('DD-MM-YYYY'); // cambiar el formato de hora
            
            //traigo la url de la pelicula 
            console.log(getUrl(req.oroginalUrl)) //muestra la ruta 

            return res.status(200).json({
                ok: true,
                meta: {
                    total: 1
                },
                data: movie
            });
        
        } catch (error) {
            console.log(error)
            return res.status(error.status || 500).json({
                ok: false,
                status : error.status || 500,
                msg: error.message,
            })
        }
    },
    newest : async (req,res) =>{
        const {limit} = req.query;
        const options = {
            include : [
                {
                    association: 'genre', // devuelvo los géneros y les quito atributos
                    attributes : {
                        exclude : ['created_at', 'updated_at']
                    }
                },
                {
                    association: 'actors',
                    attributes : {
                        exclude : ['created_at', 'updated_at']
                    },
                },
            ],
            attributes : {
                exclude : ['created_at', 'updated_at', 'genre_id']
            },
            limit : limit? +limit :5,
            order : ['release_date']
        };
        
        try {
            const movies = await db.Movie.findAll(options);

            const moviesModify =  movies.map(movie => {
                return {
                    ...movie.dataValues,
                    link : `${getUrlBase(req)}/${movie.id}`
                }
            })
            return res.status(200).json({
                ok: true,
                meta:{
                    status : 200
                },
                data : {
                    movies : moviesModify
                }
            })
        
        } catch (error) {
            console.log(error)
            return res.status(error.status || 500).json({
                ok: false,
                status : error.status || 500,
                msg: error.message,
            })
        }
    },
    recomended: async (req, res) => {
        const { limit } = req.query;


        try {
            let total = await db.Movie.count();
            const movies = await db.Movie.findAll({
                include: [
                    {
                        association: "genre",
                        attributes: {
                            exclude: ["created_at", "updated_at"]
                        },
                    }
                ],
                attributes: {
                    exclude: ['created_at', 'updated_at', 'genre_id']
                },
                where: {
                    rating: { [db.Sequelize.Op.gte]: 8 }
                },
                order: [
                    ['rating', 'DESC']
                ],
                limit: limit ? +limit : 5,
            })

            movies.forEach(movie => {
                movie.release_date = moment(movie.release_date).format()
            });

            const moviesModify = movies.map(movie => {
                return {
                    ...movie.dataValues,
                    link: `${getUrlBase(req)}/movies/${movie.id}`
                }
            })

            return res.status(200).json({
                ok: true,
                meta: {
                    status: 200
                },
                data: {
                    items: moviesModify.length,
                    total,
                    movies: moviesModify
                }
            })

        } catch (error) {
            console.log(error)
            return res.status(error.status || 500).json({
                ok: false,
                status: error.status || 500,
                msg: error.message,
            })
        }
    },
    create: async (req,res) => {
        const {title, rating, awards, release_date, length, genre_id} = req.body; // rewquiero lo datos de body
        let errors = []
        try {

            for (const key in req.body) {     // recorro un objeto y creo una validacion
               if(!req.body[key]){
                errors = [
                    ...errors,
                    {
                        fields : key,
                        msg : `El campo ${key} es obligatorio`
                    }
                ]
               }
            };

            if(errors.length){
                throw createError(400, 'Ups, hay errores')
            }


            const newMovie = await db.Movie.create( // creo la pelicula
                {
                    title: title?.trim(),
                    rating,
                    awards,
                    release_date,
                    length,
                    genre_id
                });

                return res.status(201).json({
                    ok: true,
                    meta:{
                        status : 201
                    },
                    data : {
                        newMovie
                    }
                })

                if (newMovie) {
                    return res.status(200).json({
                        ok: true,
                        meta : {
                            total: 1,
                            link: `${req.protocol}://${req.get('host')}/movies/${newMovie.id}`  
                        },
                        data: newMovie
                    });
                }

        } catch (error){  // cambio la forma en la que se muestra el error
            const showErrors = error.errors.map(error => {
                return {
                    path : error.path,
                    message: error.message
                }
            })
            return res.send(showErrors)
        } 
        
        
        // catch (error) {
        //     console.log(error);
        //     return res.status(error.status || 500).json({
        //         ok: false,
        //         msg: error.message
        //     })
        // }

    },
    update: function (req,res) {
        let movieId = req.params.id;
        Movies
        .update(
            {
                title: req.body.title,
                rating: req.body.rating,
                awards: req.body.awards,
                release_date: req.body.release_date,
                length: req.body.length,
                genre_id: req.body.genre_id
            },
            {
                where: {id: movieId}
            })
        .then(()=> {
            return res.redirect('/movies')})            
        .catch(error => res.send(error))
    },
    destroy: function (req,res) {
        let movieId = req.params.id;
        Movies
        .destroy({where: {id: movieId}, force: true}) // force: true es para asegurar que se ejecute la acción
        .then(()=>{
            return res.redirect('/movies')})
        .catch(error => res.send(error)) 
    }
}

module.exports = moviesController;