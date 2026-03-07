'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"flutter_bootstrap.js": "19190e9b6afae475914d58db24476a49",
"version.json": "70073abd017641a548a16de01bccc9dd",
"index.html": "5be7b48d4482be90b67eb7b86f4cfa13",
"/": "5be7b48d4482be90b67eb7b86f4cfa13",
"main.dart.js": "82abb0d2ceaa62875dfd8d2bcefc7c00",
"excel/index.html": "5c01c85e4d28f49ca7b8fdf397b95d76",
"excel/vite.svg": "8e3a10e157f75ada21ab742c022d5430",
"excel/assets/index-Ee9A-V15.js": "1ebe761e6f1fd774b96349442247cd11",
"excel/assets/index-uY9H4Hhg.css": "16b16d69a28cc92844802d30cd3ab627",
"flutter.js": "888483df48293866f9f41d3d9274a779",
"favicon.png": "2c0f09f32aedfcc055efc10262a58b76",
"emmi-bot-lite/blocks/explorer-kit_blocks.js": "49a06e8cb48a78b26d672782218eecb1",
"emmi-bot-lite/blocks/emmi-bot-v2_blocks.js": "203c94c327cc27517f4c0bc73087398b",
"emmi-bot-lite/blocks/emmi-bipedal_blocks.js": "06f0520e9949a3aed9cd9ae100135da5",
"emmi-bot-lite/blocks/esp32_blocks.js": "19b157f48728e67bf7b0ee2c7da649c4",
"emmi-bot-lite/blocks/variable_blocks.js": "5f0c5cb68acfac8a6e2e6624042fef60",
"emmi-bot-lite/blocks/emmi-v1_blocks.js": "8f2e73d8dd5f6b699ae479f07b18efff",
"emmi-bot-lite/blocks/communication_blocks.js": "4040d0838549280f5f94df918b60d4a8",
"emmi-bot-lite/test_blocks.js": "18526a9c1c5f461ca880b2d5d0544f6f",
"emmi-bot-lite/test_parse.js": "dd7765592d273f91468ff6c2bad7cac3",
"emmi-bot-lite/index.html": "ffe6dd53b2ccb7f819f2e22b2043ad5e",
"emmi-bot-lite/css/styles.css": "1bba493d7332d56c7e34e3ab2050de42",
"emmi-bot-lite/test_regex.js": "b6c2210336c06f75f9122005504a08ae",
"emmi-bot-lite/js/translations.js": "36a7d751e58484d641726f82f1172f7a",
"emmi-bot-lite/js/custom_styles.js": "3b7695561725577416a8d8faaa23f2de",
"emmi-bot-lite/js/tests/emmi_exporter.test.js": "1778387a0759ad6a20329d2faff3c5e9",
"emmi-bot-lite/js/toolbox.js": "8c1af7e1dd029b22842759c9d469e84d",
"emmi-bot-lite/js/commands/common_commands.js": "5cdcbd18dca36f53d1ebf38176ad8f6b",
"emmi-bot-lite/js/commands/emmi-v1_commands.js": "a6cd0294d8290c46e4948aaebb02f8a3",
"emmi-bot-lite/js/commands/explorer-kit_commands.js": "6de055d67f2358d1aed3a62a92c9ba19",
"emmi-bot-lite/js/commands/emmi-bipedal_commands.js": "cd048ae9d5a4cd548a47632b84289f49",
"emmi-bot-lite/js/commands/emmi-bot-v2_commands.js": "0106b865c94a29a55db3dd431d9d4494",
"emmi-bot-lite/js/generators/emmi-v1_generators.js": "bf680e10bb103e48b85f3e804a10f048",
"emmi-bot-lite/js/generators/arduino_explorer-kit.js": "aca645f7ae1e70db8f38e825a62e95cf",
"emmi-bot-lite/js/generators/variable_generators.js": "a612758277a6b974be255e31636d87ff",
"emmi-bot-lite/js/generators/arduino_emmi-bipedal.js": "220cbbaad003003a193a09fbe5f2eb65",
"emmi-bot-lite/js/generators/arduino_emmi-bot-v2.js": "d5cc45d0e2fa5daea99b4b325b1683f6",
"emmi-bot-lite/js/generators/java.js": "bb3d848827f1f180895c009fa5aac4ac",
"emmi-bot-lite/js/generators/emmi-bot-v2_generators.js": "68e4ef57854f1bdae128eb4c2380a054",
"emmi-bot-lite/js/generators/emmi_exporter.js": "599a5b86035116d67ddf4f6d7117857b",
"emmi-bot-lite/js/generators/communication_generators.js": "376d58ae9d31bf6093c4b13b74b0b2af",
"emmi-bot-lite/js/generators/arduino.js": "b2389d473945cac528534787fa058914",
"emmi-bot-lite/js/generators/python_emmi-bipedal.js": "fcbb4ae4ce3fcd15ff895df1466d8c53",
"emmi-bot-lite/js/generators/python_emmi-bot-v2.js": "a556c107088970454a0a505ddba1c218",
"emmi-bot-lite/js/generators/python_explorer-kit.js": "8d391273831b3b45b448d9aaa228ca97",
"emmi-bot-lite/js/generators/python.js": "cdc1c9d8220f09d867bec6d46dbe9d7c",
"emmi-bot-lite/js/blockly-mapper.js": "a49375e4133bcb76c407d38d77a6c473",
"emmi-bot-lite/js/app.js": "afaa9c18d7a8b2b103694515b9e779b6",
"emmi-bot-lite/.claude/settings.local.json": "53c65f5b2c2c50b854e2e43d1bc62f69",
"emmi-bot-lite/.claude/launch.json": "41ca4fdedc145669d04b238aedc75fd5",
"emmi-bot-lite/README.md": "e7304692c9bc654c97a7ad6e82555d1d",
"emmi-bot-lite/headers/CuteBuzzerSounds.h": "e3a18d143c042d3cfb93f689a9013c93",
"emmi-bot-lite/headers/PlayRtttl.h": "1a9ab31ce4eb0e743d001eb579bdaf93",
"emmi-bot-lite/headers/PlayRtttl.hpp": "8e560b8fe083da0a46a7f505324f757e",
"emmi-bot-lite/lib/prism/components/prism-python.min.js": "547961f651d376e906ff261e15dd5697",
"emmi-bot-lite/lib/prism/components/prism-java.min.js": "5604f7c290ae9e1f2bbcb4f77d769fd2",
"emmi-bot-lite/lib/prism/components/prism-cpp.min.js": "291e2672e5d1710a90f3f372773d2e90",
"emmi-bot-lite/lib/prism/components/prism-c.min.js": "434e7bb526a0dc43c57fd310c4cf109b",
"emmi-bot-lite/lib/prism/prism.min.js": "5740fd50852ac337bf97da724102a548",
"emmi-bot-lite/lib/prism/themes/prism.min.css": "3d63b6da134643cdd75afe1ae8928ba5",
"emmi-bot-lite/lib/blockly/blockly.min.js": "93a0cf87a40b8f94751d3defc9372dbe",
"emmi-bot-lite/lib/blockly/media/click.mp3": "217b91bbdfcb63874a5efa3a6f361380",
"emmi-bot-lite/lib/blockly/media/delete.mp3": "dfe58781f5681406e35890a575765345",
"emmi-bot-lite/lib/blockly/media/disconnect.mp3": "a275b1ba174f21b5688e333266375718",
"emmi-bot-lite/lib/blockly/media/sprites.png": "e48f1139901723da3ecbd9dab1ba2e3d",
"emmi-bot-lite/lib/font-awesome/css/all.min.css": "9402848c3d4bbc710c764326f8b887c9",
"emmi-bot-lite/lib/font-awesome/webfonts/fa-solid-900.ttf": "25914cfeafced317e1a0372187fbb2b9",
"emmi-bot-lite/lib/font-awesome/webfonts/fa-regular-400.woff2": "023a4a925fa3fce0f66b769ef6bbb264",
"emmi-bot-lite/lib/font-awesome/webfonts/fa-v4compatibility.ttf": "71808e147dc6d82c198a4ba292c0cb69",
"emmi-bot-lite/lib/font-awesome/webfonts/fa-regular-400.ttf": "a0cc1c8265e3163aa654a5284ea11ace",
"emmi-bot-lite/lib/font-awesome/webfonts/fa-v4compatibility.woff2": "c9e50ccabe9e36f370272197595ea1e5",
"emmi-bot-lite/lib/font-awesome/webfonts/fa-solid-900.woff2": "6c4eee562650e53cee32496bdfbe534b",
"emmi-bot-lite/lib/font-awesome/webfonts/fa-brands-400.woff2": "b6356c957274676e6571c1ff5e11c9a8",
"emmi-bot-lite/lib/font-awesome/webfonts/fa-brands-400.ttf": "1931427c23716bb4ff98d03627f7137c",
"emmi-bot-lite/test_output.txt": "eaa3f5fdb821bbee530073b569435ad7",
"emmi-bot-lite/server.log": "283bebd71e4c42ca6961b1bc8810e1d8",
"powerpoint/index.html": "c29ef9e712301061ebfad9ef027d8907",
"powerpoint/vite.svg": "8e3a10e157f75ada21ab742c022d5430",
"powerpoint/assets/index-BbfzEzEM.js": "76014c215db547be3578076bfb1f76fc",
"powerpoint/assets/index-DDzBPqJa.css": "14b6007ba4ebc1a24f0646aa31e36a8f",
"icons/Icon-192.png": "2c0f09f32aedfcc055efc10262a58b76",
"icons/Icon-maskable-192.png": "2c0f09f32aedfcc055efc10262a58b76",
"icons/Icon-maskable-512.png": "2c0f09f32aedfcc055efc10262a58b76",
"icons/Icon-512.png": "2c0f09f32aedfcc055efc10262a58b76",
"manifest.json": "dc25c4942c4f8b02f15bfa33f5aab1d7",
"assets/AssetManifest.json": "db998b086720891c258e2f63f85b7faf",
"assets/NOTICES": "4842b650965fd1adc1a312fd1a374bb8",
"assets/FontManifest.json": "c75f7af11fb9919e042ad2ee704db319",
"assets/AssetManifest.bin.json": "48cce55382338342052a11896cd0383d",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "33b7d9392238c04c131b6ce224e13711",
"assets/packages/font_awesome_flutter/lib/fonts/Font-Awesome-7-Free-Regular-400.otf": "b2703f18eee8303425a5342dba6958db",
"assets/packages/font_awesome_flutter/lib/fonts/Font-Awesome-7-Brands-Regular-400.otf": "1fcba7a59e49001aa1b4409a25d425b0",
"assets/packages/font_awesome_flutter/lib/fonts/Font-Awesome-7-Free-Solid-900.otf": "5b8d20acec3e57711717f61417c1be44",
"assets/packages/flutter_inappwebview_web/assets/web/web_support.js": "509ae636cfdd93e49b5a6eaf0f06d79f",
"assets/packages/flutter_inappwebview/assets/t_rex_runner/t-rex.css": "5a8d0222407e388155d7d1395a75d5b9",
"assets/packages/flutter_inappwebview/assets/t_rex_runner/t-rex.html": "16911fcc170c8af1c5457940bd0bf055",
"assets/packages/flutter_chat_ui/assets/icon-seen.png": "b9d597e29ff2802fd7e74c5086dfb106",
"assets/packages/flutter_chat_ui/assets/2.0x/icon-seen.png": "10c256cc3c194125f8fffa25de5d6b8a",
"assets/packages/flutter_chat_ui/assets/2.0x/icon-attachment.png": "9c8f255d58a0a4b634009e19d4f182fa",
"assets/packages/flutter_chat_ui/assets/2.0x/icon-error.png": "5a59dc97f28a33691ff92d0a128c2b7f",
"assets/packages/flutter_chat_ui/assets/2.0x/icon-arrow.png": "8efbd753127a917b4dc02bf856d32a47",
"assets/packages/flutter_chat_ui/assets/2.0x/icon-send.png": "2a7d5341fd021e6b75842f6dadb623dd",
"assets/packages/flutter_chat_ui/assets/2.0x/icon-document.png": "e61ec1c2da405db33bff22f774fb8307",
"assets/packages/flutter_chat_ui/assets/2.0x/icon-delivered.png": "b6b5d85c3270a5cad19b74651d78c507",
"assets/packages/flutter_chat_ui/assets/icon-attachment.png": "17fc0472816ace725b2411c7e1450cdd",
"assets/packages/flutter_chat_ui/assets/icon-error.png": "4fceef32b6b0fd8782c5298ee463ea56",
"assets/packages/flutter_chat_ui/assets/3.0x/icon-seen.png": "684348b596f7960e59e95cff5475b2f8",
"assets/packages/flutter_chat_ui/assets/3.0x/icon-attachment.png": "fcf6bfd600820e85f90a846af94783f4",
"assets/packages/flutter_chat_ui/assets/3.0x/icon-error.png": "872d7d57b8fff12c1a416867d6c1bc02",
"assets/packages/flutter_chat_ui/assets/3.0x/icon-arrow.png": "3ea423a6ae14f8f6cf1e4c39618d3e4b",
"assets/packages/flutter_chat_ui/assets/3.0x/icon-send.png": "8e7e62d5bc4a0e37e3f953fb8af23d97",
"assets/packages/flutter_chat_ui/assets/3.0x/icon-document.png": "4578cb3d3f316ef952cd2cf52f003df2",
"assets/packages/flutter_chat_ui/assets/3.0x/icon-delivered.png": "28f141c87a74838fc20082e9dea44436",
"assets/packages/flutter_chat_ui/assets/icon-arrow.png": "678ebcc99d8f105210139b30755944d6",
"assets/packages/flutter_chat_ui/assets/icon-send.png": "34e43bc8840ecb609e14d622569cda6a",
"assets/packages/flutter_chat_ui/assets/icon-document.png": "b4477562d9152716c062b6018805d10b",
"assets/packages/flutter_chat_ui/assets/icon-delivered.png": "b064b7cf3e436d196193258848eae910",
"assets/packages/model_viewer_plus/assets/model-viewer.min.js": "dd677b435b16f44e4ca08a9f354bac24",
"assets/packages/model_viewer_plus/assets/template.html": "8de94ff19fee64be3edffddb412ab63c",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/lib/Resources/MovementIcons/Down.svg": "e89ffa1124944dd3c46683645cd12836",
"assets/lib/Resources/MovementIcons/Up.svg": "85b389f2db1c4fe873ac937c1704792c",
"assets/lib/Resources/MovementIcons/Back.svg": "7d48696181f819cf2f33b7e87a567030",
"assets/lib/Resources/MovementIcons/Foward.svg": "9764a6a1ade885766c23470bad541095",
"assets/lib/Resources/loopIcons/Repeat.svg": "54fe2e52e9c30f7e1020c455984508ef",
"assets/lib/Resources/loopIcons/repeatblock.png": "cf7e8d958603b49cd76e8e484829b1ad",
"assets/lib/Resources/loopIcons/repeat.png": "ae59a298a7286ade441f71bd1737f28e",
"assets/lib/Resources/loopIcons/repeatsvg.svg": "b9b0891373df573c06c8a61d65a63eec",
"assets/lib/Resources/little_emmi.svg": "1f43c32fdd9c076bb6100fcbabfd6298",
"assets/lib/Resources/BlocksStructure/blueCmd.svg": "9b1b0f52f8ac15fe51944ffbf8b34e71",
"assets/AssetManifest.bin": "0f22bf77c7d8b4bf4684edfcaae51c00",
"assets/fonts/MaterialIcons-Regular.otf": "9992dc17c9886d783bd12b6d7cd27049",
"assets/assets/paint/paint.html": "003ae073a4bb130bb26628ea0a57b550",
"assets/assets/word_web/word/index.html": "9521c235209fe228ab5f37f6198e5649",
"assets/assets/word_web/word/styles.css": "6b197a4df7614f300ffdbca3c17f0b8d",
"assets/assets/word_web/word/app.js": "fa64367728ac4f9650d8ee52810bd952",
"assets/assets/images/emmi_vibe.png": "fd24a5defe2a1ee10826475465510f3a",
"assets/assets/images/pythonide.png": "5b48fc0cf90a1d897acddec340b14ca9",
"assets/assets/images/imgnobgnew.png": "3abe66a270a7204346d081430a0e4a63",
"assets/assets/images/emmi.png": "9b15beca74a167a9cc4273de9177110c",
"assets/assets/images/ar.png": "be3ec0da025680aa77a347ccf52f5202",
"assets/assets/images/edu.jpg": "22cd06fdd98525d6ff0c8403397761c3",
"assets/assets/images/pyflownobg.png": "eb1610f06bda6a18e9f4ce32a5a9a833",
"assets/assets/images/soundmachinenobg.png": "e89cbe6c2b3243d154d192f0ddad8d5d",
"assets/assets/images/python.jpg": "2b4aab3c71d4f5fc332195b9a58f81d4",
"assets/assets/images/soundmachine.png": "16024beba82ccc527a8c2e4ad0354603",
"assets/assets/images/imagegen.png": "f1767f76d2141ec7856293c84a0f2331",
"assets/assets/images/javaflow.png": "79ca447a47a19a3242c0716e977187ce",
"assets/assets/images/java.jpg": "4e49a9b89f4d5a8d6291c7098c084181",
"assets/assets/images/posemodel.png": "a683c01d6bc84494c60f0d1be0068e34",
"assets/assets/images/excel.png": "3edfff6c056d123206f7771445954d9e",
"assets/assets/images/mitnobg.png": "67822bb6e2b64d36a2b24584bce5b546",
"assets/assets/images/pyflow.png": "6fb17368ab10e3f1993d21e3a8c2961f",
"assets/assets/images/javaflownobg.png": "b05537ae3d3e2cb26cafb3997818a616",
"assets/assets/images/suno.png": "d93115ff3b86df4cedf7ca18c66c52e7",
"assets/assets/images/chatai.png": "3c8fbc671fac19490f0685ee13c5053e",
"assets/assets/images/ppt.png": "451a4c3922ac31a9ae1ce4f29d872930",
"assets/assets/images/qubiq_music.png": "170de8c8246d358a671cb17092fd0d69",
"assets/assets/images/qubiq_logo.png": "2c0f09f32aedfcc055efc10262a58b76",
"assets/assets/images/posemodelnobg.png": "438d937560083082b672ee6de7262bba",
"assets/assets/images/word.png": "5b621df54b59b3feb1dba3f9e370f752",
"assets/assets/images/littleemmi.png": "bfabc1de1dc1d095507b97e0fbb2490d",
"assets/assets/images/quiz.png": "f62f3a6f81fa18930e9cf79c1cb82d01",
"assets/assets/images/appdev.png": "6970233870514a771c36ae1a614277c2",
"assets/assets/images/soundgen.png": "45e386008fad83859ec4747d2de6d087",
"assets/assets/images/mit.png": "903e59505a46cdebaf318cdef7754513",
"assets/assets/web/dist/index.html": "c29ef9e712301061ebfad9ef027d8907",
"assets/assets/web/dist/vite.svg": "8e3a10e157f75ada21ab742c022d5430",
"assets/assets/web/dist/assets/index-BbfzEzEM.js": "76014c215db547be3578076bfb1f76fc",
"assets/assets/web/dist/assets/index-DDzBPqJa.css": "14b6007ba4ebc1a24f0646aa31e36a8f",
"assets/assets/excel_web/dist/index.html": "5c01c85e4d28f49ca7b8fdf397b95d76",
"assets/assets/excel_web/dist/vite.svg": "8e3a10e157f75ada21ab742c022d5430",
"assets/assets/excel_web/dist/assets/index-Ee9A-V15.js": "1ebe761e6f1fd774b96349442247cd11",
"assets/assets/excel_web/dist/assets/index-uY9H4Hhg.css": "16b16d69a28cc92844802d30cd3ab627",
"assets/assets/drone_block_coding/index.html": "e809d0e2e9d37e22d74ee52944aed0e0",
"assets/assets/drone_block_coding/assets/index-BEt8sx31.js": "48ac44db5ce4b1af12ef9228b91a6508",
"assets/assets/drone_block_coding/assets/index-DY6ZLGE7.css": "63cdda5d61ef04b33708e9ee51e32271",
"assets/assets/drone_block_coding/media/icon.png": "d8df47228c018b01f2a33104c6ff4881",
"assets/assets/qubiq_web/qubiq_audio.html": "4391d3bce1a9ccb1eb351a4837d035de",
"assets/assets/qubiq_web/vite.svg": "8e3a10e157f75ada21ab742c022d5430",
"assets/assets/qubiq_web/assets/qubiq_audio_index.css": "e0eace39493a7201097246bcbe6a0fea",
"assets/assets/qubiq_web/assets/qubiq_audio_index.js": "643ca817139037f1b6922ad41f7e718d",
"assets/assets/www/blocks/custom_blocks.js": "4ef30105d8ac0479aa5d591fcc628377",
"assets/assets/www/blocks/python-blocks.js": "fbde72c711d9e847a5e9f0df103fb5b5",
"assets/assets/www/index.html": "013c1af560be3a84370dec953b2e1fc0",
"assets/assets/www/index.css": "1c7726866dd5cc3b34a837e428cc83f7",
"assets/assets/www/vite.svg": "8e3a10e157f75ada21ab742c022d5430",
"assets/assets/www/index_MIT.html": "7cb6e5d78b47263736d2347e7fedd901",
"assets/assets/www/lib/codemirror/python.min.js": "79e417cc0d775fc28c736ef58c2c499b",
"assets/assets/www/lib/codemirror/codemirror.min.js": "3b00a21bbc8f3a1fa7df392628c92364",
"assets/assets/www/lib/codemirror/dracula.min.css": "19d0dc0eb99d49abba3a33f0f8af6bec",
"assets/assets/www/lib/codemirror/codemirror.min.css": "c1da630111dc87f804761ecc75f89eac",
"assets/assets/www/lib/skulpt/skulpt.min.js": "30264e94120f89f51771ec1ec258f3fd",
"assets/assets/www/lib/skulpt/chart.min.js": "3cf395c5f5e4c79e91a28f3ce30aba73",
"assets/assets/www/lib/skulpt/skulpt-matplotlib.min.js": "0dbcd0b2f5b5bb4088d0613b4d68182f",
"assets/assets/www/lib/skulpt/ai_ds_mocks.js": "0381743dcf9728b137022c3566c91ca7",
"assets/assets/www/lib/skulpt/skulpt-stdlib.js": "be285bb759236c932341cf829a9d9016",
"assets/assets/www/lib/skulpt/mysql_mock.js": "cb113b4f61a78206c70007a27e096f61",
"assets/assets/www/lib/skulpt/plt_wrapper.js": "a384951c8bb20e94740e4adf57f58567",
"assets/assets/www/lib/blockly/blocks_compressed.js": "f57782183dd35772e9f7e084271c51d1",
"assets/assets/www/lib/blockly/blockly_compressed.js": "dbf7a35ff1c6355d35712e1838843821",
"assets/assets/www/lib/blockly/en.js": "18f0cacac1ebc7a992bb24aa94b74b20",
"assets/assets/www/lib/blockly/python_compressed.js": "abbfc9671c0decd1e8de2b762158fecb",
"assets/assets/www/assets/index-JKwT_vHL.css": "4eb0bbd5a058bcdd077ccd87a43cba28",
"assets/assets/www/assets/index-xPsAilHw.js": "cc10f0e2011b56915d6167a696150e69",
"assets/assets/www/app.js": "ce7ed05f42db47da7343b7191c07bf5f",
"assets/assets/html_learning/index.html": "166f356a9544e6efe2076bc2924cfdf6",
"assets/assets/html_learning/syllabus.js": "eef2e6ab874db4a712f8cfba7a7f75e2",
"assets/assets/html_learning/script.js": "ec4d7f0ed663d0811595c2ca1f9c8d51",
"assets/assets/html_learning/style.css": "759d107afb8d4af19927238785147779",
"assets/assets/teachable/image/teachable.svg": "8e3a10e157f75ada21ab742c022d5430",
"assets/assets/teachable/image/teachable.html": "a96e76ccd3ec8e04add8cc56d3c48a2d",
"assets/assets/teachable/image/assets/teachable-index-BGmzvaFY.css": "d054391d711dd4c06c7a185a6ae22ab2",
"assets/assets/teachable/image/assets/teachable-index-CSoxMe9Y.js": "03d90809742c0e1c6285bda4bce72dca",
"assets/assets/teachable/audio/teachable.svg": "8e3a10e157f75ada21ab742c022d5430",
"assets/assets/teachable/audio/teachable.html": "a96e76ccd3ec8e04add8cc56d3c48a2d",
"assets/assets/teachable/audio/assets/teachable-index-BGmzvaFY.css": "d054391d711dd4c06c7a185a6ae22ab2",
"assets/assets/teachable/audio/assets/teachable-index-CSoxMe9Y.js": "03d90809742c0e1c6285bda4bce72dca",
"assets/assets/teachable/pose/vite.svg": "8e3a10e157f75ada21ab742c022d5430",
"assets/assets/teachable/pose/teachable.html": "658899b29284f12766daf35acfe4c463",
"assets/assets/teachable/pose/assets/index-ECK0Mmts.css": "6013d265be1e97f8d2a81d7fe9b6bcc9",
"assets/assets/teachable/pose/assets/teachable-index-ECK0Mmts.css": "6013d265be1e97f8d2a81d7fe9b6bcc9",
"assets/assets/teachable/pose/assets/index-XQNdh-LO.js": "b09f161ddbb831844ca93e9f06fdb311",
"assets/assets/teachable/pose/assets/teachable-index-XQNdh-LO.js": "2561b539c8bb1baafc7a9bcbae2d917f",
"assets/assets/pythonide/index.html": "45dd5e52c9d990eee1b9495fd6841d1c",
"assets/assets/pythonide/ide.css": "7ba9b5cbb49def9d377405c72d50d831",
"assets/assets/pythonide/ide.js": "64bebbfb401f4926095e9d15bd9fcc2e",
"assets/assets/pythonide/templates.js": "6cdfa863c4c27e04ff0901a7fff37adb",
"assets/assets/pythonide/sw.js": "398742d90ba6193d784689e2fd4c2627",
"assets/assets/keyboard_game/index.html": "81d03d8ed739fd77f0d89908ecb64056",
"assets/assets/keyboard_game/script.js": "5f4a994bb23d51e41ef4fac0211c077f",
"assets/assets/keyboard_game/style.css": "4a2831b735fa7577ae47da2e69e0aa13",
"assets/assets/powerpoint_app/index.html": "25fce933415b17b04e6ff4d82f65a901",
"assets/assets/powerpoint_app/styles.css": "9dbc60f3cf957d13c89150bda18a7ea2",
"assets/assets/powerpoint_app/script.js": "5f072e8515fac12d9474ea8e2df0e123",
"assets/assets/powerpoint_no_ai/index.html": "c2c53cf6e80662eb2e89288a6e6ffc22",
"assets/assets/powerpoint_no_ai/styles.css": "70ff3e3f0470567b45d11c724e61d234",
"assets/assets/powerpoint_no_ai/methods.txt": "512ec89c68de0c4eb08ab264d756b9a7",
"assets/assets/powerpoint_no_ai/script.js": "56f47381b26a7d92991c34137c5c3143",
"canvaskit/skwasm.js": "1ef3ea3a0fec4569e5d531da25f34095",
"canvaskit/skwasm_heavy.js": "413f5b2b2d9345f37de148e2544f584f",
"canvaskit/skwasm.js.symbols": "0088242d10d7e7d6d2649d1fe1bda7c1",
"canvaskit/canvaskit.js.symbols": "58832fbed59e00d2190aa295c4d70360",
"canvaskit/skwasm_heavy.js.symbols": "3c01ec03b5de6d62c34e17014d1decd3",
"canvaskit/skwasm.wasm": "264db41426307cfc7fa44b95a7772109",
"canvaskit/chromium/canvaskit.js.symbols": "193deaca1a1424049326d4a91ad1d88d",
"canvaskit/chromium/canvaskit.js": "5e27aae346eee469027c80af0751d53d",
"canvaskit/chromium/canvaskit.wasm": "24c77e750a7fa6d474198905249ff506",
"canvaskit/canvaskit.js": "140ccb7d34d0a55065fbd422b843add6",
"canvaskit/canvaskit.wasm": "07b9f5853202304d3b0749d9306573cc",
"canvaskit/skwasm_heavy.wasm": "8034ad26ba2485dab2fd49bdd786837b"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
