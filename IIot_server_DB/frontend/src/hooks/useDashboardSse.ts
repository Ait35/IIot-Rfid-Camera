import { useState, useEffect, useRef } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getToken } from '../services/api';
import type {
  DashboardStats,
  RecentScan,
  SseConnectionStatus,
  SseDeviceUpdateEvent,
} from '../types';

export interface DashboardUpdatePayload {
  stats?: DashboardStats;
  recentScans?: RecentScan[];
}

interface UseDashboardSseOptions {
  enabled: boolean;
  onDashboardUpdate: (payload: DashboardUpdatePayload) => void;
  onDevicesUpdate: (updates: SseDeviceUpdateEvent[]) => void;
  onUnauthorized: () => void;
}

class FatalSseError extends Error {}

/**
 * เชื่อมต่อ Server-Sent Events (SSE) กับ Backend (/iiot/events/stream)
 * เพื่อรับข้อมูล Dashboard และสถานะอุปกรณ์แบบเรียลไทม์โดยไม่ต้อง Polling
 */
export function useDashboardSse({
  enabled,
  onDashboardUpdate,
  onDevicesUpdate,
  onUnauthorized,
}: UseDashboardSseOptions): SseConnectionStatus {
  const [sseStatus, setSseStatus] = useState<SseConnectionStatus>('disconnected');

  // เก็บ callback ล่าสุดใน ref เพื่อไม่ให้เกิดการ reconnect เมื่อฟังก์ชันเปลี่ยน reference
  const callbacksRef = useRef({
    onDashboardUpdate,
    onDevicesUpdate,
    onUnauthorized,
  });

  useEffect(() => {
    callbacksRef.current = {
      onDashboardUpdate,
      onDevicesUpdate,
      onUnauthorized,
    };
  }, [onDashboardUpdate, onDevicesUpdate, onUnauthorized]);

  useEffect(() => {
    const token = getToken();
    if (!enabled || !token) {
      setSseStatus('disconnected');
      return;
    }

    const controller = new AbortController();
    let fatalError = false;
    setSseStatus('connecting');

    fetchEventSource('/iiot/events/stream', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      openWhenHidden: true,
      async onopen(response) {
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
          setSseStatus('connected');
          return;
        }
        if (response.status === 401) {
          fatalError = true;
          setSseStatus('disconnected');
          callbacksRef.current.onUnauthorized();
          throw new FatalSseError('Unauthorized SSE connection');
        }
        throw new Error(`SSE open failed with status ${response.status}`);
      },
      onmessage(msg) {
        if (msg.event === 'connected') {
          setSseStatus('connected');
          return;
        }
        if (!msg.data) return;

        if (msg.event === 'dashboard_update') {
          try {
            const payload = JSON.parse(msg.data) as DashboardUpdatePayload;
            callbacksRef.current.onDashboardUpdate(payload);
          } catch (e) {
            console.error('Failed to parse SSE dashboard_update:', e);
          }
          return;
        }

        if (msg.event === 'DevicesUpdate') {
          try {
            const updates = JSON.parse(msg.data) as SseDeviceUpdateEvent[];
            if (Array.isArray(updates) && updates.length > 0) {
              callbacksRef.current.onDevicesUpdate(updates);
            }
          } catch (e) {
            console.error('Failed to parse SSE DevicesUpdate:', e);
          }
        }
      },
      onclose() {
        setSseStatus('disconnected');
      },
      onerror(err) {
        setSseStatus('disconnected');
        if (controller.signal.aborted || fatalError || err instanceof FatalSseError) {
          throw err;
        }
        return 5000;
      },
    }).catch((err) => {
      if (!controller.signal.aborted && !(err instanceof FatalSseError)) {
        console.error('SSE stream terminated:', err);
      }
    });

    return () => {
      controller.abort();
      setSseStatus('disconnected');
    };
  }, [enabled]);

  return sseStatus;
}
