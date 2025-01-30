# SPDX-FileCopyrightText: 2020 anecdata for Adafruit Industries
# SPDX-FileCopyrightText: 2021 Neradoc for Adafruit Industries
# SPDX-FileCopyrightText: 2021-2023 Kattni Rembor for Adafruit Industries
# SPDX-FileCopyrightText: 2023 Dan Halbert for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""CircuitPython Dual Serial Sniffer Script"""
# sniffs both UART RX lines connected to the TX and RX lines of another port

import busio
import board
import supervisor

MAX_LINE = 80
BAUD = 115200

txUART = busio.UART(board.TX, board.RX, baudrate=BAUD, timeout=0) # default 9600 8N1
rxUART = busio.UART(board.D8, board.D9, baudrate=BAUD, timeout=0) # default 9600 8N1

def txCheck(tmp):
    buf = txUART.read(8)
    if buf:
        for c in [chr(b) for b in buf]:
            if c=="\r":
                continue
            if c!="\n":
              tmp += c
                #tmp += " " + str(ord(c))
            if c=="\n" or len(tmp)>MAX_LINE:
                max = "\\" if len(tmp)>MAX_LINE else ""
                print(f"> {tmp}{max}")
                tmp = ""
    return tmp

def rxCheck(tmp):
    buf = rxUART.read(8)
    if buf:
        for c in [chr(b) for b in buf]:
            if c=="\r":
                continue
            if c!="\n":
                tmp += c
                #tmp += " " + str(ord(c))
            if c=="\n" or len(tmp)>MAX_LINE:
                max = "\\" if len(tmp)>MAX_LINE else ""
                print(f"< {tmp}{max}")
                tmp = ""
    return tmp

txTmp = ""
rxTmp = ""

while True:
    txTmp = txCheck(txTmp)
    rxTmp = rxCheck(rxTmp)
    if supervisor.runtime.serial_bytes_available:
        command = input()
        print(f"\n- {command}")
        if command=='TX':
            rxUART.write(b"Test TX write...\n") # loopback jumper required TX1 to RX0
        if command=='RX':
            txUART.write(b"Test RX write...\n") # loopback jumper required TX0 to RX1
        if command=='RST':
            txUART.reset_input_buffer()
            rxUART.reset_input_buffer()
        command = ""
