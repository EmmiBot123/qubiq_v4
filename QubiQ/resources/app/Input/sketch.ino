void setup() {
  pinMode(32, OUTPUT);
  pinMode(25, OUTPUT);

}

void loop() {
    digitalWrite(32, HIGH);
    digitalWrite(25, LOW);
    delay(1*1000);
    digitalWrite(32, LOW);
    digitalWrite(25, HIGH);
    delay(1*1000);

}