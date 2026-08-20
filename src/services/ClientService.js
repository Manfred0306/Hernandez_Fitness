import ClientRepository from '../repositories/ClientRepository.js';
import AppError from '../utils/AppError.js';

export default {
  list: search => ClientRepository.list(search),
  async get(id) { const client = await ClientRepository.findById(id); if (!client) throw new AppError('Cliente no encontrado.',404); return client; },
  async byCedula(cedula) { const client = await ClientRepository.findByCedula(cedula); if (!client) throw new AppError('No existe un cliente con esa cédula.',404); return client; },
  async save(data, id) {
    if (!data.cedula || !data.nombreCompleto || !data.edad || !data.planAdquirido) throw new AppError('Complete los campos obligatorios.',400);
    return ClientRepository.save(data, id);
  },
  async setActive(id, active) { await this.get(id); await ClientRepository.setActive(id, active); }
};
