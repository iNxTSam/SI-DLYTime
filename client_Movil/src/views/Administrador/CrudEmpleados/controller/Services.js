import api from '../../../../api/client';

export const Getcrud = async (setPersonas) => {
    try {
        const response = await api.get('/crudEmpleados/consultaEmpleado')
        console.log("actualizo")
        return setPersonas(response.data);
    } catch (error) {
        return console.log(error);
    }
}

export const addCrud = async (credenciales) => {
    try {
        console.log(credenciales)
        const response = await api.post('/crudEmpleados/agregarEmpleado',credenciales)

        return response.data;
    } catch (error) {
        return console.log('Error al agregar persona:', error);
    }

}

export const patchCrud = async (credenciales) => {
    try {
        const response = await api.patch('/crudEmpleados/actualizarEmpleado',credenciales)

        return response.data;
    } catch (error) {
        return console.log('Error al modificar persona:', error);
    }
}

export const getGenero = async (setTiposGenero) => {
    try {
        const response = await api.get('/miniConsultaSelect/consultarGenero');
        setTiposGenero(response.data);
        
    } catch (error) {
        console.error('Error al obtener tipos de genero:', error);
    }
}

export const getIdentificacion = async (setTiposIdentificacion) => {
    try {
        const response = await api.get('/miniConsultaSelect/consultarIdentificacion');
        setTiposIdentificacion(response.data);
        
    } catch (error) {
        console.error('Error al obtener tipos de identificación:', error);
    }
}

export const getEstado = async (setTipoEstado) => {
    try {
        const response = await api.get('/miniConsultaSelect/consultarEstado');
        setTipoEstado(response.data);
        
    } catch (error) {
        console.error('Error al obtener tipos de identificación:', error);
    }
}
