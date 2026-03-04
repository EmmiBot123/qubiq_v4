#ifndef PLAY_RTTTL_H
#define PLAY_RTTTL_H

#if defined(ARDUINO) && ARDUINO >= 100
#include <Arduino.h>
#else
#include <ctype.h>
#include <stdint.h>
// Mock declarations for IDE linter
// These will be ignored during actual compilation if ARDUINO is defined
void ledcAttachPin(uint8_t pin, uint8_t channel);
double ledcSetup(uint8_t channel, double freq, uint8_t resolution_bits);
void ledcWriteTone(uint8_t channel, double freq);
void delay(uint32_t ms);
#endif

// RTTTL Melodies
const char StarWars[] =
    "StarWars:d=4,o=5,b=45:32p,32f#,32f#,32f#,8b.,8f#.6,32e6,32d#6,32c#6,8b.6,"
    "16f#.6,32e6,32d#6,32c#6,8b.6,16f#.6,32e6,32d#6,32e6,8c#.6,32f#,32f#,32f#,"
    "8b.,8f#.6,32e6,32d#6,32c#6,8b.6,16f#.6,32e6,32d#6,32c#6,8b.6,16f#.6,32e6,"
    "32d#6,32e6,8c#6";
const char MahnaMahna[] =
    "MahnaMahna:d=16,o=6,b=125:c#,c.,b5,8a#.5,8f.,4g#,a#,g.,4d#,8p,c#,c.,b5,8a#"
    ".5,8f.,g#.,8a#.,4g,8p,c#,c.,b5,8a#.5,8f.,4g#,f,g.,8d#.,f,g.,8d#.,f,8g,8d#."
    ",f,8g,d#,8c,a#5,8d#.,8d#.,4d#,8d#.";
const char LeisureSuit[] =
    "LeisureSuit:d=16,o=6,b=56:f.5,f#.5,g.5,g#5,32a#5,f5,g#.5,a#.5,32f5,g#5,"
    "32a#5,g#5,8c#.,a#5,32c#,a5,a#.5,c#.,32a5,a#5,32c#,d#,8e,c#.,d#,32e,c#,32d#"
    ",c#,32c#,g#5,32a#5,c#.,32a#5,c#,32d#,e,c#.,d#,32e,f#,32g#,c#.,32c#,8f.,4f#"
    ".5,4g.5,4g#5";
const char MissionImp[] =
    "MissionImp:d=16,o=6,b=95:32d,32d#,32e,32f,32f#,32g,32g#,32a,32a#,32b,32c,"
    "32c#,32d,32d#,32e,32f,32f#,32g,32g#,32a,32a#,32b,32c,32c#,32d,32d#,32e,"
    "32f,32f#,32g,32g#,32a,32a#,32b,32c,32c#";
const char Entertainer[] =
    "Entertainer:d=4,o=5,b=140:8d,8d#,8e,c6,8e,c6,8e,2c.6,8c6,8d6,8d#6,8e6,8c6,"
    "8d6,e6,8b,d6,2c6,p,8d,8d#,8e,c6,8e,c6,8e,2c.6,8p,8a,8g,8f#,8a,8c6,e6,8d6,"
    "8c6,8a,2d6";
const char Muppets[] =
    "Muppets:d=4,o=5,b=160:c6,c6,a,b,8a,b,g,p,c6,c6,a,8b,8a,8p,g.,p,e,e,g,f,8e,"
    "f,8c6,8c,8d,e,8e,8e,8p,8e,g,2p,c6,c6,a,b,8a,b,g,p,c6,c6,a,8b,a,g.,p,e,e,g,"
    "f,8e,f,8c6,8c,8d,e,8e,d,8d,c";
const char Flinstones[] =
    "Flinstones:d=4,o=5,b=40:32p,16f6,16a#,16a#6,32g6,16f6,16a#.,16f6,32d#6,"
    "32d6,32d6,32c6,32a#,32g,16c6,32a#,16a,32g,32f,16f,16a#,16a#6,32g6,16f6,"
    "16a#.,16f6,32d#6,32d6,32d6,32c6,32a#,32g,16c6,32a#,16a,32g,32f";
const char YMCA[] =
    "YMCA:d=4,o=5,b=160:8c#6,8d#6,e6,2c#6,8c#6,8d#6,e6,2c#6,8c#6,8d#6,e6,8b,8c#"
    "6,2a,8a,8b,c#6,2a,8a,8b,c#6,2a,8a,8b,c#6,8g#,8a,2f#,8f#,8g#,a,2f#,8f#,8g#,"
    "a,2f#,8f#,8g#,a,8e,8f#,2d";
const char Simpsons[] =
    "Simpsons:d=4,o=5,b=160:c.6,e6,f#6,8a6,g.6,e6,c6,8a,8f#,8f#,8f#,2g,p,8p,8f#"
    ",8f#,8f#,8g,a#.,8c6,8c6,8c6,c6";
const char Indiana[] =
    "Indiana:d=4,o=5,b=250:e,8p,8f,8g,8p,1c6,8p.,d,8p,8e,1f,p.,g,8p,8a,8b,8p,"
    "1f6,p,a,8p,8b,2c6,2d6,2e6,e,8p,8f,8g,8p,1c6,p,d6,8p,8e6,1f.6,g,8p,8g,e.6,"
    "8p,d6,8p,8g,e.6,8p,d6,8p,8g,f.6,8p,e6,8p,8d6,2c6";
const char TakeOnMe[] =
    "TakeOnMe:d=4,o=4,b=160:8f#5,8f#5,8f#5,8d5,8p,8b,8p,8e5,8p,8e5,8p,8e5,8g#5,"
    "8g#5,8a5,8b5,8a5,8a5,8a5,8e5,8p,8d5,8p,8f#5,8p,8f#5,8p,8f#5,8e5,8e5,8f#5,"
    "8e5,8f#5,8f#5,8f#5,8d5,8p,8b,8p,8e5,8p,8e5,8p,8e5,8g#5,8g#5,8a5,8b5,8a5,"
    "8a5,8a5,8e5,8p,8d5,8p,8f#5,8p,8f#5,8p,8f#5,8e5,8e5";
const char Looney[] =
    "Looney:d=4,o=5,b=140:32p,c6,8f6,8e6,8d6,8c6,a.,8c6,8f6,8e6,8d6,8d#6,e.6,"
    "8e6,8e6,8c6,8d6,8c6,8e6,8c6,8d6,8a,8c6,8g,8a#,8a,8f";
const char _20thCenFox[] =
    "20thCenFox:d=16,o=5,b=140:b,8p,b,b,2b,p,c6,32p,b,32p,c6,32p,b,32p,c6,32p,"
    "b,8p,b,b,b,4b,8p,b,b,b,4b,8p,b,b,b,4b,8p,b,b,b,4b,8p,b,b,b,b,4b";
const char Bond[] =
    "Bond:d=4,o=5,b=80:32p,16c#6,32d#6,32d#6,16d#6,8d#6,16c#6,16c#6,16c#6,16c#"
    "6,32e6,32e6,16e6,8e6,16d#6,16d#6,16d#6,16c#6,32d#6,32d#6,16d#6,8d#6,16c#6,"
    "16c#6,16c#6,16c#6,32e6,32e6,16e6,8e6,16d#6,16d6,16c#6,16c#7";
const char GoodBad[] =
    "GoodBad:d=4,o=5,b=56:32p,32a,32d6,32a,32d6,8a,32d6,32d6,32d6,a#,32d6,32a,"
    "32d6,32a,32d6,8a,32d6,8d6,8d6,a#,32d6,32a,32d6,32a,32d6,8a,32d6,32d6,32d6,"
    "a#,32d6,32p,32d6,32a,32d6,8a,32d6";
const char PinkPanther[] =
    "PinkPanther:d=4,o=5,b=160:8d#,8e,2p,8f#,8g,2p,8d#,8e,16p,8f#,8g,16p,8c6,"
    "8b,16p,8d#,8e,16p,8b,2a#,2a,16p,8a,8g,8e,8d,2e";
const char A_Team[] =
    "A_Team:d=8,o=5,b=125:4d#6,a#,2d#6,16p,g#,4a#,4d#.,p,16g,16a#,d#6,a#,f6,2d#"
    "6,16p,c#.6,16c6,16a#,g#.,2a#";
const char Jeopardy[] =
    "Jeopardy:d=4,o=5,b=125:c6,f6,c6,f5,c6,f6,2c6,c6,f6,c6,f,a.,8g,8f,8e,8d,8c#"
    ",c6,f6,c6,f5,c6,f6,2c6,f6,2d6,c.6,b,1g,1f";
const char Gadget[] =
    "Gadget:d=16,o=5,b=50:32d#,32f,32f#,32g#,a#,f#,a,f,g#,f#,32d#,32f,32f#,32g#"
    ",a#,d#6,4d6,32d#,32f,32f#,32g#,a#,f#,a,f,g#,f#,8d#";
const char Smurfs[] =
    "Smurfs:d=32,o=5,b=200:4c#6,16p,4f#6,p,16c#6,p,8d#6,p,8b,p,4g#,16p,4c#6,p,"
    "16a#,p,8f#,p,8a#,p,4g#,4p,g#,p,a#,p,c#6,p,d#6,p,4d#6,4p,4c#6,p,4f#6,p,16c#"
    "6,p,8d#6,p,8b,p,4g#,16p,4c#6,p,16a#,p,8b,p,8f,p,4f#";
const char Toccata[] =
    "Toccata:d=4,o=5,b=125:a,8g,8a,8g,8f#,8e,8d,32c#"; // Shortened
const char Short[] = "Short:d=4,o=5,b=100:c,d,e,f,g,a,b,c6";
const char JingleBell[] =
    "JingleBell:d=8,o=5,b=125:32p,a,a,4a,a,a,4a,a,c6,f.,16g,2a,a#,a#,a#.,16a#,"
    "a,a,a.,16a,g,g,a,4g,4c6";
const char Rudolph[] =
    "Rudolph:d=8,o=5,b=125:a,g,e,c,2a,g.,16g,a,g,a,g,2c6,b,a,g,f,2d,d.,16e,f,g,"
    "g,a,g,d,e,f,g,2a,g,2e";
const char WeWishYou[] =
    "WeWishYou:d=4,o=5,b=140:d,g,8g,8a,8g,8f#,e,c,e,a,8a,8b,8a,8g,f#,d,f#,b,8b,"
    "8c6,8b,8a,g,e,d,e,a,f#,2g";
const char WinterWonderland[] =
    "WinterWonderland:d=4,o=5,b=125:8d#,8d#,8d#,d#,8e,8f#,8g#,8a,2a#,b,2d#6,a#,"
    "8p,8d#,8g#,8g,f#,8d#,8a#"; // Shortened
const char OhDennenboom[] =
    "OhDennenboom:d=8,o=5,b=125:d,g.,16g,g,a,b.,16b,2b,a,b,c6.,16c6,b,a,g.,16p";
const char LetItSnow[] = "LetItSnow:d=4,o=5,b=125:8c6,8b,8a,8g,f,e,d,c,"
                         "g#,a,2a#,8c6,8b,8a,8g,f#,e,d,c#,a,b,2c6";
const char Frosty[] = "Frosty:d=4,o=5,b=125:g,e.,8f,g,2c6,8b,8c6,d6,c6,"
                      "b,a,2g,8c,8d,e,g,a,f,2g,e,d,2c";
const char SilentNight[] =
    "SilentNight:d=4,o=5,b=125:g.,8a,g,e,2p,g.,8a,g,e,2p,d6,2d6,b,2p,c6,2c6,g";
const char LastChristmas[] =
    "LastChristmas:d=8,o=5,b=125:c,2c,a,a,2g,2f,4f,4g,2a,b.,16b,a,g,f,e,d";
const char AllIWant[] =
    "AllIWant:d=4,o=5,b=125:4f#,8g,4a,4b,4c#6,4d6,2e6,4d6,4c#6,4b,4a,4g,2f#";
const char AmazingGrace[] =
    "AmazingGrace:d=4,o=5,b=100:8d,2g,8b,8g,2b,a,2g,4e,2d,8d,2g,8b,8g,2b,a,2d6";

// Helper for RTTTL
inline void playRtttlBlocking(int pin, char *p) {
  // Absolutely no error checking.
  uint8_t default_dur = 4;
  uint8_t default_oct = 6;
  int bpm = 63;
  int num;
  long wholenote;
  long duration;
  uint8_t note;
  int scale;

  // format: d=N,o=N,b=N:
  // find the start (skip name)
  while (*p != ':')
    p++; // ignore name
  p++;   // skip ':'

  // get default duration
  if (*p == 'd') {
    p++;
    p++; // skip "d="
    num = 0;
    while (isdigit(*p)) {
      num = (num * 10) + (*p++ - '0');
    }
    if (num > 0)
      default_dur = num;
    p++; // skip comma
  }

  // get default octave
  if (*p == 'o') {
    p++;
    p++; // skip "o="
    num = *p++ - '0';
    if (num >= 3 && num <= 7)
      default_oct = num;
    p++; // skip comma
  }

  // get BPM
  if (*p == 'b') {
    p++;
    p++; // skip "b="
    num = 0;
    while (isdigit(*p)) {
      num = (num * 10) + (*p++ - '0');
    }
    bpm = num;
    p++; // skip colon
  }

  // BPM usually expresses the number of quarter notes per minute
  wholenote = (60 * 1000L / bpm) *
              4; // this is the time for whole note (in milliseconds)

  // Configure LEDC for ESP32 Tone
  // Note: These functions must be provided by the Arduino framework
  ledcSetup(4, 2000, 8); // Channel 4, 2kHz, 8bit
  ledcAttachPin(pin, 4);

  // now begin note loop
  while (*p) {
    num = 0;
    while (isdigit(*p)) {
      num = (num * 10) + (*p++ - '0');
    }

    if (num)
      duration = wholenote / num;
    else
      duration = wholenote / default_dur;

    note = 0;

    switch (*p) {
    case 'c':
      note = 1;
      break;
    case 'd':
      note = 3;
      break;
    case 'e':
      note = 5;
      break;
    case 'f':
      note = 6;
      break;
    case 'g':
      note = 8;
      break;
    case 'a':
      note = 10;
      break;
    case 'b':
      note = 12;
      break;
    case 'p':
      note = 14;
      break;
    }
    p++;

    // check sharp
    if (*p == '#') {
      note++;
      p++;
    }

    // check dot
    if (*p == '.') {
      duration += duration / 2;
      p++;
    }

    // check scale
    if (isdigit(*p)) {
      scale = *p - '0';
      p++;
    } else {
      scale = default_oct;
    }

    scale += note; // unused? no, logic needs freq calc

    if (*p == ',')
      p++; // skip comma for next note

    // Play the note
    if (note) {
      // Frequency calculation
      // Notes are: c, c#, d, d#, e, f, f#, g, g#, a, a#, b
      // Frequencies for Octave 4:
      // C4: 261, C#4: 277, D4: 294, D#4: 311, E4: 330, F4: 349, F#4: 370, G4:
      // 392, G#4: 415, A4: 440, A#4: 466, B4: 494 Logic: Note number 1..12.

      int frequencies[] = {0,   262, 277, 294, 311, 330, 349,
                           370, 392, 415, 440, 466, 494};
      int freq = frequencies[note];

      // Adjust for octave
      // Base is Octave 4 in array
      int shift = scale - 4;
      if (shift > 0) {
        for (int i = 0; i < shift; i++)
          freq *= 2;
      } else if (shift < 0) {
        for (int i = 0; i < -shift; i++)
          freq /= 2;
      }

      if (note == 14) { // Pause
        ledcWriteTone(4, 0);
      } else {
        ledcWriteTone(4, freq);
      }

      delay(duration);
      ledcWriteTone(4, 0); // Stop
    }
  }
}
#endif
