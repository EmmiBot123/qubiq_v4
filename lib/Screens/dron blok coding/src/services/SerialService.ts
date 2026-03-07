
export class SerialService {
    private port: any = null;
    private writer: any = null;
    private isConnected: boolean = false;

    async connect() {
        if (!('serial' in navigator)) {
            alert('Web Serial API not supported in this browser. Please use Chrome or Edge.');
            return false;
        }

        try {
            // @ts-ignore
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 115200 });

            this.writer = this.port.writable.getWriter();
            this.isConnected = true;
            console.log('Serial Connected');
            return true;
        } catch (err) {
            console.error('Connection failed:', err);
            return false;
        }
    }

    async send(data: string) {
        if (!this.writer || !this.isConnected) {
            console.warn('Not connected to serial port');
            return;
        }

        try {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(data + '\n');
            await this.writer.write(bytes);
            console.log('Sent to drone:', data);
        } catch (err) {
            console.error('Send failed:', err);
            this.isConnected = false;
        }
    }

    async disconnect() {
        try {
            if (this.writer) {
                await this.writer.releaseLock();
                this.writer = null;
            }
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
            this.isConnected = false;
        } catch (err) {
            console.error('Disconnect failed:', err);
        }
    }

    getConnected() {
        return this.isConnected;
    }
}

export const serialService = new SerialService();
