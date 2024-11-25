import type {RemoteService, RemoteServiceArg} from './types';

import {is_string} from '@blake.regalia/belt';

/**
 * Normalizes a {@link RemoteServiceArg} into a {@link RemoteService}
 */
export const remote_service = (z_service: RemoteServiceArg): RemoteService => is_string(z_service)? {origin:z_service}: z_service;
