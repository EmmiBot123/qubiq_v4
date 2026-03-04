#include <Emmi_Voice_Lib.h>
#include "voice_hi_i_am_emmi.h"
#include "voice_obstacle.h"
#include "voice_hi_i_am_emmi.cpp"
#include "voice_obstacle.cpp"

#define DAC_PIN 26
#define SAMPLE_RATE 8000
#define SAMPLE_PERIOD_US (1000000 / SAMPLE_RATE)

// -------------------------------------------------
// Blocking RAW audio playback (simple & stable)
// -------------------------------------------------
static void playRaw(const uint8_t* data, uint32_t len) {
  // center DAC before playback (avoid pop)
  dacWrite(DAC_PIN, 128);
  delay(5);

  for (uint32_t i = 0; i < len; i++) {
    dacWrite(DAC_PIN, data[i]);
    delayMicroseconds(SAMPLE_PERIOD_US);
  }

  // silence after playback
  dacWrite(DAC_PIN, 128);
}

// -------------------------------------------------
// Voice wrappers (BLOCKING)
// -------------------------------------------------
void playVoice_HI_I_AM_EMMI() {
  playRaw(voice_hi_i_am_emmi, voice_hi_i_am_emmi_len);
}

void playVoice_OBSTACLE() {
  playRaw(voice_obstacle, voice_obstacle_len);
}

// -------------------------------------------------
// Stop sound = force silence AFTER playback
// -------------------------------------------------
void stopVoice() {
  dacWrite(DAC_PIN, 128);
}
