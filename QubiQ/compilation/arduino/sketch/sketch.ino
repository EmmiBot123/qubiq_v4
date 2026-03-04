const int pinl = 16;
const int pinr = 2;
const int pinl1 = 17;
const int pinr2 = 4;


void setup() {
  pinMode(pinl, OUTPUT);
pinMode(pinr, OUTPUT);
pinMode(pinl1, OUTPUT);
pinMode(pinr2, OUTPUT);


}

void loop() {
    digitalWrite(pinl, HIGH);
    digitalWrite(pinr, LOW);
    digitalWrite(pinl1, LOW);
    digitalWrite(pinr2, HIGH);
    delay(5*1000);
    digitalWrite(pinl, HIGH);
    digitalWrite(pinr, HIGH);
    digitalWrite(pinl1, HIGH);
    digitalWrite(pinr2, HIGH);
    delay(1*1000);

}