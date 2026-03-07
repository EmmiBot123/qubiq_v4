# EMMI Firmware Scripting Reference

Welcome to the **EMMI (Educational Mobile Machine Interface)** firmware guide. This firmware allows you to program the EMMI robot using a compact, pipe-delimited scripting language stored in flash memory.

Scripts are strings of text sent over the Serial Monitor. Once received, they are saved to non-volatile memory (Flash), so the robot remembers its program even after a restart.

---

## **1. The Script Structure**

A valid script is a single string divided into three main sections by special markers.

**Format:**
```
|I|...init commands...|S|...setup commands...|L|...loop commands...|
```

### **Sections**
1.  **`|I|` (Initialization)**
    *   **Purpose**: Tells the firmware which hardware modules to enable at startup.
    *   **Content**: A set of flags (e.g., `E` for Eyes, `M` for Motors).
    *   **Runs**: Once, immediately on boot.
    
2.  **`|S|` (Setup)**
    *   **Purpose**: Initial configuration or "run once" actions.
    *   **Runs**: Once, after initialization.

3.  **`|L|` (Loop)**
    *   **Purpose**: The main program logic.
    *   **Runs**: Repeatedly, forever.

**Minimal Example:**
`|I|E|S|ERN|L|ERN|D500|ERF|D500|`
*   **Init**: Enable Eyes (`E`).
*   **Setup**: Turn Red LED On (`ERN`).
*   **Loop**: Blink Red LED (On -> Wait -> Off -> Wait -> Repeat).

---

## **2. Command Syntax**

All commands are enclosed or separated by the pipe character `|`.

### **Hardware Control**

#### **LEDs (Eyes)**
Control the RGB LEDs.
*   **`ER<N/F>`**: Red (N=On, F=Off) &rarr; `|ERN|`, `|ERF|`
*   **`EG<N/F>`**: Green &rarr; `|EGN|`, `|EGF|`
*   **`EB<N/F>`**: Blue &rarr; `|EBN|`, `|EBF|`
*   **`EA<N/F>`**: All &rarr; `|EAN|`, `|EAF|`

#### **Motors (Wheels)**
Move the robot.
*   **`MF`**: Move Forward &rarr; `|MF|`
*   **`MB`**: Move Backward &rarr; `|MB|`
*   **`ML`**: Turn Left &rarr; `|ML|`
*   **`MR`**: Turn Right &rarr; `|MR|`
*   **`MS`**: Stop &rarr; `|MS|`

#### **Buzzer (Sound)**
Play sounds or notes.
*   **`BN<note>`**: Play Note (e.g., `A4`, `C5`, `F#4`) &rarr; `|BNA4|`
*   **`BF<freq>`**: Play Frequency (Hz) &rarr; `|BF440|`
*   **`BS`**: Stop Sound &rarr; `|BS|`

#### **Timing**
*   **`D<ms>`**: Delay (wait) for milliseconds &rarr; `|D1000|` (1 second)
*   **`D <var>`**: Delay using a variable value &rarr; `|D I1|` (delay by value of I1)

### **Inputs & Sensors**
These commands read sensors. In logic (loops/ifs), they return the value. As standalone commands, they print the value to Serial.

*   **`TR`**: Touch Sensor (Returns `0` or `1`).
*   **`VR`**: Vision/Light Sensor (Returns `0-4095` approx).
*   **`AR`**: Audio/Mic Sensor (Returns `0` or `1`).

### **Bluetooth**
Bluetooth is enabled from the init section using a device name.

*   **Init Flag**: `R"<name>"` in `|I|` (example: `|I|E|R"EMMI"|...`)
*   **`R(A)`**: Bluetooth bytes available (integer)
*   **`R(R)`**: Read one Bluetooth byte (integer / ASCII code)
*   **`R(T)`**: Read full string
*   **`R(TE)`**: Read string until newline
*   **`R(F)`**: Parse float from Bluetooth stream
*   **`R(P,"text")`**: Print text to Bluetooth
*   **`R(PE,"text")`**: Print line to Bluetooth
*   **`R(W,"text")`**: Write raw text to Bluetooth

`R(A)` and `R(R)` can be used inside `O...` expressions and `G(...)` assignments.

### **Arduino Translation Reference (AI Code Generation)**

Use this section when you want an AI to generate raw Arduino code from EMMI script commands.

#### **Target Board + Pin Map (from firmware)**

The firmware is for ESP32 and uses this exact pin mapping:

```cpp
// src/config/Pins.h
#define EYE_R      33
#define EYE_G      25
#define EYE_B      32

#define BUZZER_PIN 19
#define MIC_PIN    17
#define LDR_PIN    35
#define TOUCH_PIN  39

#define MOTOR_L1   13
#define MOTOR_L2   14
#define MOTOR_R1   27
#define MOTOR_R2   26
```

#### **Minimum Arduino Setup Equivalent**

```cpp
#include <Arduino.h>

void initEyes() {
  // Active-low LEDs: LOW=ON, HIGH=OFF
  digitalWrite(EYE_R, HIGH);
  digitalWrite(EYE_G, HIGH);
  digitalWrite(EYE_B, HIGH);
  pinMode(EYE_R, OUTPUT);
  pinMode(EYE_G, OUTPUT);
  pinMode(EYE_B, OUTPUT);
}

void initWheels() {
  pinMode(MOTOR_L1, OUTPUT);
  pinMode(MOTOR_L2, OUTPUT);
  pinMode(MOTOR_R1, OUTPUT);
  pinMode(MOTOR_R2, OUTPUT);
  digitalWrite(MOTOR_L1, LOW);
  digitalWrite(MOTOR_L2, LOW);
  digitalWrite(MOTOR_R1, LOW);
  digitalWrite(MOTOR_R2, LOW);
}

void initBuzzer() {
  const int CH_BUZZ = 3;
  const int BUZZ_RES = 8;
  ledcSetup(CH_BUZZ, 2000, BUZZ_RES);
  ledcAttachPin(BUZZER_PIN, CH_BUZZ);
  ledcWrite(CH_BUZZ, 0);
}

void initSensors() {
  pinMode(TOUCH_PIN, INPUT);
  pinMode(MIC_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
}

void setup() {
  Serial.begin(115200);
  delay(500);
  initEyes();
  initWheels();
  initBuzzer();
  initSensors();
}
```

#### **Script Section Mapping**

- `|I|...|S|...|L|...|` -> boot flow is: init section once, setup section once, loop section forever
- In firmware terms: `scriptInit();` -> `scriptSetup();` -> repeated `scriptLoop();`

#### **Init Flags -> Arduino Initialization Calls**

- `E` in `|I|` -> `eyesInit();`
- `B` in `|I|` -> `buzzerInit();`
- `M` in `|I|` -> `wheelsInit();`
- `T` in `|I|` -> `touchInit();`
- `A` in `|I|` -> `micInit();`
- `V` in `|I|` -> `ldrInit();`
- `R"<name>"` in `|I|` -> `btInit("<name>");`

#### **Command -> Arduino Code Mapping**

**Eyes / RGB (active-low):**

- `|ERN|` -> `digitalWrite(EYE_R, LOW);`
- `|ERF|` -> `digitalWrite(EYE_R, HIGH);`
- `|EGN|` -> `digitalWrite(EYE_G, LOW);`
- `|EGF|` -> `digitalWrite(EYE_G, HIGH);`
- `|EBN|` -> `digitalWrite(EYE_B, LOW);`
- `|EBF|` -> `digitalWrite(EYE_B, HIGH);`
- `|EAN|` -> `digitalWrite(EYE_R, LOW); digitalWrite(EYE_G, LOW); digitalWrite(EYE_B, LOW);`
- `|EAF|` -> `digitalWrite(EYE_R, HIGH); digitalWrite(EYE_G, HIGH); digitalWrite(EYE_B, HIGH);`

**Wheels / motors:**

- `|MF|` -> `digitalWrite(MOTOR_L1, HIGH); digitalWrite(MOTOR_L2, LOW); digitalWrite(MOTOR_R1, HIGH); digitalWrite(MOTOR_R2, LOW);`
- `|MB|` -> `digitalWrite(MOTOR_L1, LOW); digitalWrite(MOTOR_L2, HIGH); digitalWrite(MOTOR_R1, LOW); digitalWrite(MOTOR_R2, HIGH);`
- `|ML|` -> `digitalWrite(MOTOR_L1, LOW); digitalWrite(MOTOR_L2, HIGH); digitalWrite(MOTOR_R1, HIGH); digitalWrite(MOTOR_R2, LOW);`
- `|MR|` -> `digitalWrite(MOTOR_L1, HIGH); digitalWrite(MOTOR_L2, LOW); digitalWrite(MOTOR_R1, LOW); digitalWrite(MOTOR_R2, HIGH);`
- `|MS|` -> `digitalWrite(MOTOR_L1, LOW); digitalWrite(MOTOR_L2, LOW); digitalWrite(MOTOR_R1, LOW); digitalWrite(MOTOR_R2, LOW);`

**Buzzer:**

- `|BN<note>|` and `|BP<note>|` -> `buzzerPlayNote("<note>");`
- `|BF<freq>|` -> `ledcWriteTone(3, <freq>);`
- `|BS|` -> `ledcWriteTone(3, 0); ledcWrite(3, 0);`

**Timing + print + direct sensor commands:**

- `|D1000|` -> `delay(1000);`
- `|D I1|` -> `delay(resolveVarAsInt("I1"));`
- `|Phello|` -> `Serial.println("hello");`
- `|PI1|` -> `Serial.println(resolveVarAsString("I1"));`
- `|TR|` -> `Serial.print("TOUCH:"); Serial.println(digitalRead(TOUCH_PIN));`
- `|VR|` -> `Serial.print("LDR:"); Serial.println(analogRead(LDR_PIN));`
- `|AR|` -> `Serial.print("MIC:"); Serial.println(digitalRead(MIC_PIN));`

**Bluetooth commands:**

- `|R(A)|` -> `int v = btAvailable(); Serial.print("BT:A:"); Serial.println(v);`
- `|R(R)|` -> `int v = btRead(); Serial.print("BT:R:"); Serial.println(v);`
- `|R(T)|` -> `String s = btReadString(); Serial.print("BT:T:"); Serial.println(s);`
- `|R(TE)|` -> `String s = btReadStringUntil('\n'); Serial.print("BT:TE:"); Serial.println(s);`
- `|R(F)|` -> `float f = btParseFloat(); Serial.print("BT:F:"); Serial.println(f);`
- `|R(P,"text")|` -> `btPrint("text");`
- `|R(PE,"text")|` -> `btPrintln("text");`
- `|R(W,"text")|` -> `btWrite("text");`

#### **Variables (`G`) Translation Rules**

Internal arrays in firmware:

```cpp
int    gI[5];
float  gF[5];
char   gC[5];
String gS[5];
bool   gB[5];
```

Mapping examples:

- `|G(I,1,=,10)|` -> `gI[0] = 10;`
- `|G(I,1,+,5)|` -> `gI[0] += 5;`
- `|G(F,2,*,2)|` -> `gF[1] *= 2.0f;`
- `|G(C,1,=,'R')|` -> `gC[0] = 'R';`
- `|G(S,1,=,"HELLO")|` -> `gS[0] = "HELLO";`
- `|G(B,1,=,1)|` -> `gB[0] = true;`
- `|G(B,1,!,0)|` -> `gB[0] = !gB[0];`

Special behavior implemented for Bluetooth char reads:

- `|G(C,1,=,R(R))|` (also `BR`) only updates `C1` when byte is valid.
- If read returns `-1`, `\r`, or `\n`, `C1` is not overwritten (previous value is kept).

#### **Expression (`O`) Translation Rules**

Format: `O<op>,<a>,<b>`

- Arithmetic operators: `+ - * / % ^`
- Compare operators: `== = != ! < <= > >=`
- Returns `int` result (`1` true / `0` false for comparisons)

Type inference used by firmware:

- `'X'` -> char
- `"TEXT"` -> string
- `12.3` -> float
- `12` -> int
- variable refs (`I1`, `F1`, `C1`, `S1`, `B1`) keep variable type

Examples:

- `O+,2,3` -> `5`
- `O=,C1,'R'` -> `1` when char matches
- `O=,S1,"OK"` -> string compare
- `O>,R(A),0` -> true when Bluetooth buffer has data

#### **Flow Control Translation Rules**

- `|C(<expr>){<true>}{<false>}|` -> `if (...) { ... } else { ... }`
- `|W(<expr>){<body>}|` -> `while (...) { ... }`
- `|F(start-end,step){<body>}|` -> `for (...) { ... }`
- `|K(value,(case){body}(D){default})|` -> `switch/case`
- `|X|` -> `break;` (breaks current `W`/`F`; in `K`, break is consumed by switch logic)

#### **Serial Parser Behavior (important for AI integrations)**

- Valid incoming script must include all markers: `|I|`, `|S|`, `|L|`
- On valid script receive:
  - `flashWriteString(script);`
  - `Serial.println(":$#$:");`
  - `Serial.flush();`
  - `delay(100);`
  - `ESP.restart();`
- On invalid script:
  - `Serial.println("ERROR: Invalid Format. Script must contain |I|, |S|, and |L|.");`

#### **Runtime Control + Credential Commands (with responses)**

- **Cloud sync toggle (saved in flash):**
  - Send `##C1` -> response `CLOUDSYNC:ON` (boot S3 sync enabled)
  - Send `##C0` -> response `CLOUDSYNC:OFF` (boot S3 sync disabled)
  - Default on a fresh device is **OFF**
- **Input mode quick switch:**
  - Send `#$%` or `*&(` -> response `MODE:AUTO_BOTH`
- **Credential mode (`C@*`)**:
  - Send `C@*` when idle -> response `CRED:WAITING`
  - Send `C@*` again while in credential mode -> response `CRED:CANCEL`
  - If no complete credentials arrive before timeout -> response `CRED:TIMEOUT`
  - While in credential mode:
    - `W@<ssid>` -> `CRED:SSID:<ssid>`
    - `W*<password>` -> `CRED:PASS:OK`
    - `B@<bucket>` -> `CRED:BUCKET:<bucket>`
    - `S@<serial_id>` -> `CRED:SERIAL:<serial_id>`
    - After all 4 are received, firmware saves to flash -> `CRED:SAVED`

#### **Boot Cloud Sync (`syncScriptFromS3AtBoot`)**

- **Enable/disable:** controlled by `##C1` / `##C0` and saved in flash (`CLOUD_SYNC`)
- **Default state:** OFF on a fresh device
- **Required saved values:** `WIFI_SSID`, `WIFI_PASS`, `BUCKET`, `SERIAL_ID`
- **S3 files used:**
  - `https://<bucket>.s3.<region>.amazonaws.com/<serial>/<serial>_check.txt`
  - `https://<bucket>.s3.<region>.amazonaws.com/<serial>/<serial>_cmd.txt`
- **Flow:**
  - Boot reads `<serial>_check.txt`
  - If value is `1`, boot downloads `<serial>_cmd.txt`, validates script (`|I|`, `|S|`, `|L|`), saves to flash
  - Then boot writes `0` back to `<serial>_check.txt`

#### **Cloud Sync LED Indication**

- WiFi searching: **Blue blinking**
- Reading check file: **Solid Blue**
- Downloading new script: **Solid Cyan** (Green + Blue)
- WiFi unavailable / WiFi connect fail: **Red blink x3**
- Check file download error: **Magenta blink x3** (Red + Blue)
- Update failed (cmd download fail / invalid cmd script / check reset PUT fail): **Yellow blink x3** (Red + Green)
- Sync success: **Green blink x2**

#### **AI Prompt Template (recommended)**

If you use another AI to generate Arduino code from commands, include these constraints:

```text
Target: ESP32.
Use pin map exactly: EYE_R=33, EYE_G=25, EYE_B=32, BUZZER_PIN=19, MIC_PIN=17, LDR_PIN=35, TOUCH_PIN=39, MOTOR_L1=13, MOTOR_L2=14, MOTOR_R1=27, MOTOR_R2=26.
Eyes are active-low.
Buzzer uses LEDC channel 3, 8-bit resolution.
Preserve C1 when Bluetooth read is invalid (-1, \r, \n).
Emit confirmation token :$#$: before restart when saving a new script.
```

---

## **3. Global Variables**

EMMI provides 25 global variables across 5 data types. Each type has 5 slots (1-indexed).

### **Variable Slots**

| Type | Slots | Default | Example Values |
|------|-------|---------|----------------|
| **Int** | `I1 I2 I3 I4 I5` | `0` | `10`, `-5`, `4095` |
| **Float** | `F1 F2 F3 F4 F5` | `0.0` | `3.14`, `0.5` |
| **Char** | `C1 C2 C3 C4 C5` | `\0` | `A`, `z` |
| **String** | `S1 S2 S3 S4 S5` | `""` | `"HELLO"` |
| **Bool** | `B1 B2 B3 B4 B5` | `false` | `1` (true), `0` (false) |

### **Setting Variables: `G()` Command**

**Syntax**: `|G(<type>,<index>,<operator>,<value>)|`

| Parameter | Description |
|-----------|-------------|
| `type` | `I`, `F`, `C`, `S`, or `B` |
| `index` | `1` to `5` |
| `operator` | `=` (set), `+` `-` `*` `/` `%` (math), `!` (toggle bool) |
| `value` | Number, string literal, sensor code (`TR`,`VR`,`AR`), or variable ref (`I1`,`F2`, etc.) |

**Supported Operators per Type:**

| Type | Operators |
|------|-----------|
| **Int (I)** | `=  +  -  *  /  %` |
| **Float (F)** | `=  +  -  *  /` |
| **Char (C)** | `=` |
| **String (S)** | `=  +` (concatenate) |
| **Bool (B)** | `=  !` (toggle) |

### **Examples**

**Basic Assignment:**
```text
|G(I,1,=,10)|        I1 = 10
|G(F,2,=,3.14)|      F2 = 3.14
|G(C,1,=,'A')|       C1 = 'A'
|G(S,1,=,"HELLO")|   S1 = "HELLO"
|G(B,1,=,1)|         B1 = true
```

**Arithmetic (modify in place):**
```text
|G(I,1,+,5)|         I1 += 5  (was 10, now 15)
|G(F,2,*,2)|         F2 *= 2  (was 3.14, now 6.28)
|G(B,1,!,0)|         B1 = !B1 (toggle)
```

**From Sensors:**
```text
|G(I,1,=,TR)|        I1 = touch sensor value
|G(I,2,=,VR)|        I2 = light sensor value
|G(I,3,=,AR)|        I3 = mic sensor value
```

**Copy Between Variables:**
```text
|G(I,1,=,I2)|        I1 = I2
```

### **Using Variables as Operands**

Variable names (`I1`..`I5`, `F1`..`F5`, `C1`..`C5`, `S1`..`S5`, `B1`..`B5`) work anywhere a value is expected:

| Usage | Example | Meaning |
|-------|---------|---------|
| **Delay** | `\|D I1\|` | Delay by value of I1 ms |
| **Condition** | `C(O>,VR,I1){...}{...}` | If light > I1 |
| **For Loop** | `F(I1-I2,1){...}` | Loop from I1 to I2 |
| **Switch** | `K(I1, (1){...} (0){...})` | Switch on I1 |
| **While** | `W(O>,I1,0){...}` | While I1 > 0 |
| **Operator** | `O+,I1,I2` | Compute I1 + I2 |
| **Print** | `\|PI1\|` | Print value of I1 |

### **Full Script Example: Variable-Controlled Blink**
```text
|I|E|S|G(I,1,=,300)|L|EAN|D I1|EAF|D I1|
```
*   **Setup**: Set I1 = 300.
*   **Loop**: Blink all LEDs using I1 (300ms) as the delay.

### **Full Script Example: Countdown For-Loop**
```text
|I|E|S|G(I,1,=,1)|G(I,2,=,5)|L|F(I1-I2,1){|EAN|D200|EAF|D200|}|
```
*   **Setup**: I1 = 1, I2 = 5.
*   **Loop**: Blink 5 times (for i = 1 to 5).

### **Full Script Example: Sensor Threshold Check**
```text
|I|E|M|V|S|G(I,1,=,500)|L|C(O>,VR,I1){|MF|}{|MS|}|
```
*   **Setup**: I1 = 500 (light threshold).
*   **Loop**: If light > I1, move forward. Else stop.

---

## **4. Logic & Control Flow**

This is where the magic happens. You can create intelligent behaviors using Loops and Conditions.

### **Expressions**
Logic requires comparison. We use the **`O`** (Operator) command for this.
**Format**: `O<operator>,<value1>,<value2>`

*   **Operators**: `==`, `!=`, `<`, `>`, `<=`, `>=`
*   **Arithmetic**: `+`, `-`, `*`, `/`
*   **Values**: Numbers (`100`, `3.14`), Sensor Codes (`TR`, `VR`, `AR`), Bluetooth (`R(A)`, `R(R)`), or Variable Refs (`I1`, `F2`, `C1`, `S1`, etc.).

### **Value Types in Comparisons**
When you compare values with `O...`, type is inferred from syntax:

*   **Single quotes** (`'E'`) -> **Char**
*   **Double quotes** (`"EMMI"`) -> **String**
*   **No quotes** (`10`, `3.14`) -> **Int / Float**
*   **Variables** (`C1`, `S1`, `I1`, `F1`) -> use the variable's own type

This allows direct type-safe checks like:

*   `O=,C1,'E'` -> true when char `C1` is `E`
*   `O=,S1,"EMMI"` -> true when string `S1` equals `EMMI`
*   `O>,F1,1.5` -> float comparison

**Examples**:
*   `O==,TR,1`: *Is Touch Sensor pressed?*
*   `O<,VR,500`: *Is Light Sensor value less than 500?*

### **Conditional (If-Else)**
Execute code only if a condition is met.

**Syntax**:
`|C(<expression>){<true_commands>}{<else_commands>}|`
*(The `{else}` block is optional)*

**Example (Touch Reaction)**:
```text
|C(O==,TR,1){|MF|}{|MS|}|
```
*Logic: If Touch is pressed (1), Move Forward. Else (not pressed), Stop.*

**Example (Bluetooth Char Match)**:
```text
|I|E|R"EMMI"|S|L|C(O>,R(A),0){|G(C,1,=,R(R))|}{}|C(O=,C1,'E'){|ERN|D200|ERF|D200|}{}|
```
*Logic: If a Bluetooth byte is available, read it into `C1`. If `C1` is char `E`, blink red LED.*

### **While Loop**
Repeat code *while* a condition is true.

**Syntax**:
`|W(<expression>){<body_commands>}|`

**Example (Drive until dark)**:
```text
|W(O>,VR,200){|MF|}|MS|
```
*Logic: While light level > 200, Move Forward. Once it gets dark (<=200), the loop ends and we Stop.*

### **For Loop**
Repeat code a fixed number of times.

**Syntax**:
`|F(<start>-<end>,<step>){<body_commands>}|`

**Example (Blink 5 times)**:
```text
|F(1-5){|EAN|D200|EAF|D200|}|
```

### **Switch Case**
Choose between multiple options based on a value.

**Syntax**:
`|K(<value>, (<case1>){<body>} (<case2>){<body>} (D){<default>} )|`

**Example**:
```text
|K(TR, (1){|MF|} (0){|MS|} )|
```
*Logic: If TR is 1, Move Forward. If TR is 0, Stop.*

### **Break**
Exit a loop immediately.

**Syntax**: `|X|`

**Example**:
```text
|W(O==,1,1){ |MF| C(O==,TR,1){|X|} }| |MS|
```
*Logic: Loop forever (1==1) moving forward. BUT, if Touch is pressed, execute `|X|` to break the loop, then Stop.*

---

## **5. Advanced Examples**

### **Example 1: Obstacle Avoider**
*Uses Touch Sensor to back up and turn.*
```text
|I|E|M|T|S|L|
C(O==,TR,1)
{
  |MB|D500|MR|D300|  (Hit something: Back up, Turn Right)
}
{
  |MF|               (Path clear: Move Forward)
}
|
```
*Minified String:* `|I|E|M|T|S|L|C(O==,TR,1){|MB|D500|MR|D300|}{|MF|}|`

### **Example 2: Light Alarm**
*Wait for light, then sound alarm until touched.*
```text
|I|E|B|V|T|S|
|W(O<,VR,500){|D100|}   (Wait while it's dark)
|L|                     (Loop: It's bright now!)
|BF1000|D100|BS|D100|   (Alarm sound)
C(O==,TR,1){|X|}        (Stop alarm if touched... wait, X breaks loop, but we need to stop L section?)
                        (Note: X breaks current W/F loop. To stop main Loop, we just stop logic.)
|
```

## **6. Ready-to-Run Scripts**

Copy and paste these directly into the Serial Monitor.

**Blinky (Hello World)**
`|I|E|S|L|EAN|D500|EAF|D500|`

**Police Siren (Red/Blue Toggle)**
`|I|E|S|L|ERN|EBF|D200|ERF|EBN|D200|`

**Touch Toggle (Move only when touched)**
`|I|M|T|S|L|C(O==,TR,1){|MF|}{|MS|}|`

**Complex Demo (Light Sensitive + Obstacle Avoid + Sound)**
`|I|E|B|M|T|V|S|EAN|D100|EAF|D100|EAN|D100|EAF|L|W(O==,1,1){|C(O>,VR,1000){|MF|EGN|BF880|}{|MS|ERN|BS|}|C(O==,TR,1){|MB|D500|MR|D300|X|}|}|EBN|D1000|EBF|`

## **Troubleshooting**
- **Commands ignored?** Check your `|I|` section. Did you enable the hardware (e.g., `M` for motors)?
- **Syntax Error?** Nested braces `{}` must match perfectly.
- **Typo?** Unknown tokens are usually ignored, check Serial output (Debug mode) to see what's happening.

`#$%` or `*&(` switches mode and responds `MODE:AUTO_BOTH`.
