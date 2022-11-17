// obtener la url de las peliculas
const getUrlBase  = (req) =>{
    return `${req.protocol}://${req.get('host')}`

}
const getUrl  = (req) =>{
    return `${req.protocol}://${req.get('host')}${req.originalUrl}`

}

module.exports = {
    getUrlBase,
    getUrl
}

// console.log(getUrl(req.oroginalUrl)) ---muestra la ruta 
// console.log(getUrl(req.protocol)) ---muestra el http
// console.log(getUrl(req.host)) --- muestra el puerto

