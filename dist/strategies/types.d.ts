interface GenericDevice {
    name: string;
    type: string;
}
export declare namespace RfidReader {
    type Type = 'RFID_READER';
    type Tag = string;
    type Protocol = {
        EM4100: string;
        ISO11785_FDX_B: string;
        PHIDGET_TAG: string;
    };
    interface Device extends GenericDevice {
        type: Type;
    }
}
export declare namespace RotaryEncoder {
    type Type = 'ROTARY_ENCODER';
    interface Device extends GenericDevice {
        type: Type;
    }
}
export {};
