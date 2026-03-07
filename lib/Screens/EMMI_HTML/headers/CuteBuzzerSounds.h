#ifndef CuteBuzzerSounds_h
#define CuteBuzzerSounds_h

#if defined(ARDUINO) && ARDUINO >= 100
#include <Arduino.h>
#else
#include <stdint.h>
void delay(uint32_t ms);
void ledcAttachPin(uint8_t pin, uint8_t channel);
double ledcSetup(uint8_t channel, double freq, uint8_t resolution_bits);
void ledcWriteTone(uint8_t channel, double freq);
#endif

// Sound definitions
#define S_CONNECTION 0
#define S_DISCONNECTION 1
#define S_BUTTON_PUSHED 2
#define S_MODE1 3
#define S_MODE2 4
#define S_MODE3 5
#define S_SURPRISE 6
#define S_OHOOH 7
#define S_OHOOH2 8
#define S_CUDDLY 9
#define S_SLEEPING 10
#define S_HAPPY 11
#define S_SUPER_HAPPY 12
#define S_HAPPY_SHORT 13
#define S_SAD 14
#define S_CONFUSED 15
#define S_FART1 16
#define S_FART2 17
#define S_FART3 18

class CuteBuzzerSounds {
public:
  void init(int pin) {
    _pin = pin;
    // Setup LEDC channel 5 (4 is used by RTTTL, using 5 to be safe or same is
    // fine)
    ledcSetup(5, 2000, 8);
    ledcAttachPin(_pin, 5);
  }

  void play(int soundName) {
    switch (soundName) {
    case S_CONNECTION:
      _tone(1000, 100);
      _tone(2000, 100);
      break;
    case S_DISCONNECTION:
      _tone(2000, 100);
      _tone(1000, 100);
      break;
    case S_BUTTON_PUSHED:
      _tone(3000, 50);
      break;
    case S_MODE1:
      _tone(500, 50);
      _tone(1000, 50);
      break;
    case S_MODE2:
      _tone(1000, 50);
      _tone(500, 50);
      break;
    case S_MODE3:
      _tone(1500, 50);
      _tone(500, 50);
      break;
    case S_SURPRISE:
      _tone(800, 50);
      _tone(1200, 50);
      _tone(2000, 100);
      break;
    case S_OHOOH:
      _tone(1000, 100);
      delay(50);
      _tone(1000, 100);
      break;
    case S_OHOOH2:
      _tone(1500, 100);
      delay(50);
      _tone(1500, 100);
      break;
    case S_CUDDLY:
      _tone(800, 150);
      _tone(1000, 150);
      break;
    case S_SLEEPING:
      _tone(400, 500);
      delay(200);
      _tone(300, 500);
      break;
    case S_HAPPY:
      _tone(1000, 100);
      _tone(1500, 100);
      _tone(2000, 200);
      break;
    case S_SUPER_HAPPY:
      _tone(1000, 80);
      _tone(1500, 80);
      _tone(2000, 80);
      _tone(2500, 200);
      break;
    case S_HAPPY_SHORT:
      _tone(1500, 50);
      _tone(2000, 50);
      break;
    case S_SAD:
      _tone(1500, 200);
      _tone(1000, 200);
      _tone(500, 300);
      break;
    case S_CONFUSED:
      _tone(1000, 100);
      _tone(800, 100);
      _tone(1200, 100);
      break;
    case S_FART1:
      _tone(200, 300);
      break;
    case S_FART2:
      _tone(250, 400);
      break;
    case S_FART3:
      _tone(150, 500);
      break;
    }
    ledcWriteTone(5, 0); // Ensure silence
  }

private:
  int _pin;
  void _tone(int freq, int duration) {
    ledcWriteTone(5, freq);
    delay(duration);
  }
};

CuteBuzzerSounds cute;

#endif
