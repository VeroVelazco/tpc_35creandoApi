// creo las validaciones paa exportarlas a Movie.
const objectValidate = (args, msg) => ({
     
       args,
        msg
    
});

const defaultValidations = {
    notNull : objectValidate(true, 'El campo no puede ser nulo'), 
    notEmpty : objectValidate(true, 'El valor es requerido') 
}

module.exports ={
    objectValidate,
    defaultValidations
}