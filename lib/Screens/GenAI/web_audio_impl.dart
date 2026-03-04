import 'dart:html' as html;

void playWebAudioPlayer(String url) {
  final audio = html.AudioElement(url)..autoplay = true;
  audio.play();
}
