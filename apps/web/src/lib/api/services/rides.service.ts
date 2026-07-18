import type {
  ApiResponse,
  Paginated,
  PaginationQuery,
  PublishRideRequest,
  Ride,
  RideStatus,
  UpdateRideRequest,
  Vehicle,
} from '@carpool/types';

import { apiClient } from '../client';

/**
 * search, publish, ride details
 * Base path: /rides
 */
export const ridesService = {
  /** POST /rides — publish a ride for the authenticated driver. */
  publish: async (payload: PublishRideRequest): Promise<Ride> =>
    (await apiClient.post<ApiResponse<Ride>>('/rides', payload)).data.data,

  /** GET /rides/:id — ride details (any authenticated employee). */
  getById: async (id: string): Promise<Ride> =>
    (await apiClient.get<ApiResponse<Ride>>(`/rides/${id}`)).data.data,

  /** PUT /rides/:id — update an editable ride owned by the driver. */
  update: async (id: string, payload: UpdateRideRequest): Promise<Ride> =>
    (await apiClient.put<ApiResponse<Ride>>(`/rides/${id}`, payload)).data.data,

  /** DELETE /rides/:id — cancel (soft-delete) a ride owned by the driver. */
  cancel: async (id: string): Promise<Ride> =>
    (await apiClient.delete<ApiResponse<Ride>>(`/rides/${id}`)).data.data,

  /** GET /rides/my-rides — the driver's own rides, paginated. */
  myRides: async (params?: PaginationQuery & { status?: RideStatus }): Promise<Paginated<Ride>> =>
    (await apiClient.get<ApiResponse<Paginated<Ride>>>('/rides/my-rides', { params })).data.data,

  /**
   * GET /rides/vehicle-options — the driver's active vehicles for the Offer
   * Ride form. Temporary seam: switch to vehiclesService once GET /vehicles
   * (Member 1) is implemented.
   */
  vehicleOptions: async (): Promise<Vehicle[]> =>
    (await apiClient.get<ApiResponse<Vehicle[]>>('/rides/vehicle-options')).data.data,
};
