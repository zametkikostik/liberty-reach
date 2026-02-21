# 📱 Liberty Reach — APK Build Status

## ✅ APK Проект готов!

Android проект полностью создан и готов к сборке.

## 📁 Структура проекта:

```
apps/mobile/android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── java/io/libertyreach/app/
│   │   │   ├── MainActivity.java
│   │   │   └── MainApplication.java
│   │   └── res/
│   │       ├── values/ (strings, colors, styles)
│   │       └── xml/ (security config)
│   ├── build.gradle
│   └── proguard-rules.pro
├── build.gradle
├── settings.gradle
├── gradle.properties
└── gradle/wrapper/
```

## 🚀 3 способа собрать APK:

### 1. GitHub Actions (Автоматически)

APK собирается при каждом пуше!

**Ссылка**: https://github.com/zametkikostik/liberty-reach/actions

1. Откройте последний workflow
2. Скачайте APK из артефактов
3. Установите на телефон

### 2. Онлайн (Бесплатно)

#### GitPod:
```
https://gitpod.io/#https://github.com/zametkikostik/liberty-reach
```

В терминале:
```bash
cd apps/mobile/android
./gradlew assembleDebug
```

#### GitHub Codespaces:
```
1. Создайте Codespace
2. cd apps/mobile/android
3. gradle assembleDebug
```

### 3. Локально (Требует Java)

**Установка Java:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# macOS
brew install openjdk@17

# Проверка
java -version
```

**Сборка:**
```bash
cd apps/mobile/android
gradle assembleDebug
```

**APK будет в:**
```
apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

## 📲 Установка

### Через USB:
```bash
adb install apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### Через файловый менеджер:
1. Скопируйте APK на телефон
2. Откройте файл
3. Разрешите установку
4. Установите

## 📊 Характеристики APK

| Параметр | Значение |
|----------|----------|
| App ID | io.libertyreach.app |
| Version | 1.0.0 |
| Min SDK | Android 7.0 (API 24) |
| Target SDK | Android 14 (API 34) |
| Size | ~50-80 MB |
| Architectures | arm64-v8a, armeabi-v7a, x86, x86_64 |

## 🎯 Функции

- ✅ Post-Quantum шифрование
- ✅ VoIP звонки
- ✅ Видеозвонки
- ✅ Push-to-Talk
- ✅ Обмен файлами
- ✅ P2P сеть
- ✅ Истории
- ✅ Заметки
- ✅ Папки чатов

## 📚 Документация

- [HOW_TO_GET_APK.md](./HOW_TO_GET_APK.md) — Как получить APK
- [APK_BUILD_GUIDE.md](./APK_BUILD_GUIDE.md) — Полное руководство
- [README.md](./README.md) — Главная

## ⚠️ Важно

Для сборки требуется:
- ✅ Java 17 или выше
- ✅ Android SDK (или Android Studio)
- ✅ Gradle 8.x

**Или используйте GitHub Actions для автоматической сборки!**

---

**Статус**: ✅ Готов к сборке
**Последнее обновление**: 2026-02-21
