import onvif from 'node-onvif';

export async function probeCamera(url: string, user: string, pass: string) {
    try {
        const xaddr = url.startsWith('http') ? url : `http://${url}`;
        const onvif_ptc = new onvif.OnvifDevice({
            xaddr,
            user: user,
            pass: pass
        });
        
        await onvif_ptc.init();

        const info = onvif_ptc.getInformation();
        const streamUrl = onvif_ptc.getUdpStreamUrl();    
        const snapshotUrl = onvif_ptc.getSnapshotUrl();

        let macAddress: string | null = null;
        try {
            const netRes = await onvif_ptc.services.device.getNetworkInterfaces();
            const netInterfaces = netRes?.data?.GetNetworkInterfacesResponse?.NetworkInterfaces;
            // รองรับทั้งแบบ Interface เดียว หรือเป็น Array หลาย Interface (LAN / Wi-Fi)
            const targetInterface = Array.isArray(netInterfaces) ? netInterfaces[0] : netInterfaces;
            
            if (targetInterface?.Info?.HwAddress) {
                macAddress = targetInterface.Info.HwAddress.replace(/[:-]/g, '').toUpperCase();
            }
        } catch (netErr) {
            console.warn("ไม่สามารถดึง NetworkInterfaces จาก ONVIF ได้:", netErr);
        }

        return {
            success: true,
            mac: macAddress,               
            model: info.Model,           
            serial: info.SerialNumber,     
            rtsp_url: streamUrl,           
            snapshot_url: snapshotUrl      
        };
    } catch (error) {
        return { success: false, error: "ไม่สามารถเชื่อมต่อ ONVIF ได้" };
    }
}