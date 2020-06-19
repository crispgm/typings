var app = new Vue({
  el: "#app",
  data: {
    themes: [
      {
        name: "Minimal",
        value: "minimal",
      },
      {
        name: "GMK Shoko",
        value: "gmk-shoko",
      },
      {
        name: "GMK Mizu",
        value: "gmk-mizu",
      },
      {
        name: "GMK Botanical",
        value: "gmk-botanical",
      },
      {
        name: "GMK Noel",
        value: "gmk-noel",
      },
      {
        name: "Nord",
        value: "nord",
      },
      {
        name: "GMK Demon Sword",
        value: "gmk-demon-sword",
      },
    ],
    themeName: "theme-nord",
    themeSelected: "nord",
    wcSelected: 20,
    wordCounts: [10, 20, 30, 50, 100, 200],
    langSelected: "English",
    languages: ["English", "Chinese", "Numbers"],
    originalText: "",
    renderedText: "",
    richTexts: [],
    wpm: "xxx",
    acc: "xxx",
    countChoice: 30,
    curTyping: "",
    curIndex: 0,
    curError: false,
    typingCorrectCount: 0,
    typingCount: 0,
    typingStart: null,
    typingEnd: null,
    finished: false,
    finishedTimes: 0,
    logs: [],
    logOutput: "",
  },
  watch: {
    curTyping: function (val, oldVal) {
      if (this.finished) {
        return;
      }
      if (this.typingStart == null) {
        this.typingStart = Date.now();
        this.pushLog("Typing started...");
      }
      const curChar = val[val.length - 1];
      const curWord = this.richTexts[this.curIndex].text;
      if (this.isPunctuation(curChar)) {
        if (oldVal == "") {
          this.curTyping = "";
          return;
        }
        if (curWord == this.curTyping.substr(0, this.curTyping.length - 1)) {
          this.typingCorrectCount++;
          this.richTexts[this.curIndex].klass = "typing-text-correct";
          this.pushLog(`Word [${curWord}] is CORRECT`);
        } else {
          this.richTexts[this.curIndex].klass = "typing-text-wrong";
          this.pushLog(`Word [${curWord}] is WRONG`);
        }
        this.typingCount++;
        this.acc = ((this.typingCorrectCount / this.typingCount) * 100).toFixed(
          0
        );
        this.wpm = (
          (this.typingCount / ((Date.now() - this.typingStart) / 1000)) *
          60
        ).toFixed(0);
        if (this.curIndex < this.richTexts.length - 1) {
          this.richTexts[this.curIndex + 1].klass = "typing-text-prepare";
        } else {
          this.finished = true;
          this.finishedTimes++;
          this.pushLog("========");
          this.pushLog("Congratulations!");
          this.pushLog(
            `Finished: wpm is ${this.wpm}, acc is ${this.acc}% [${this.typingCorrectCount}/${this.typingCount}].`
          );
          this.pushLog(
            `You have done ${this.formatFinishedTimes(
              this.finishedTimes
            )}. Click Restart to continue.\n`
          );
          this.saveFinishedTimes();
        }

        this.curIndex++;
        this.curTyping = "";

        this.renderText();
      } else {
        if (curWord.indexOf(this.curTyping) == -1) {
          this.curError = true;
        } else {
          this.curError = false;
        }
      }
    },
    logOutput: function (val, oldval) {
      const logOutput = this.$refs.logging;
      if (logOutput) {
        setTimeout(function () {
          logOutput.scrollTop = logOutput.scrollHeight;
        }, 50);
      }
    },
  },
  created: async function () {
    this.pushLog("Initializing variables...");
    this.initVars();
    this.pushLog("Loading theme and word count...");
    this.loadTheme();
    this.loadWordCount();
    await this.loadTexts();

    if (this.finishedTimes == 0) {
      this.pushLog("Welcome!");
    } else {
      this.pushLog(
        `Welcome back! You have done ${this.formatFinishedTimes(
          this.finishedTimes
        )}.`
      );
    }
  },
  mounted: function () {
    this.$refs.typing.focus();

    window.addEventListener("keypress", (e) => {
      const keyName = (function (keyCode) {
        if (keyCode == 13) {
          return "ENTER";
        } else if (keyCode == 32) {
          return "SPACE";
        }
        return String.fromCharCode(keyCode);
      })(e.keyCode);
      this.pushLog(`Key Pressed: <${keyName}>, KeyCode= ${e.keyCode}`);
    });
  },
  methods: {
    initVars: function () {
      this.richTexts = [];
      this.wpm = "---";
      this.acc = "---";
      this.curTyping = "";
      this.curIndex = 0;
      this.typingCorrectCount = 0;
      this.typingCount = 0;
      this.typingStart = null;
      this.typingEnd = null;
      this.finished = false;
      this.initLanguage();
      this.initFinishedTimes();
    },
    loadTexts: async function () {
      this.pushLog("Loading texts...");
      const response = await fetch("/typings/texts/fixtures.json");
      const texts = await response.json();
      this.originalText = texts[this.langSelected];
      this.pushLog("Building texts...");
      this.buildTexts();
      this.pushLog("Rendering texts...");
      this.renderText();
    },
    initLanguage: function () {
      let langSelected = window.localStorage.getItem("language");
      if (!this.languageExists(langSelected)) {
        this.pushLog(
          `Error: language ${langSelected} does not exist. Set to English.`
        );
        langSelected = "English";
        window.localStorage.setItem("language", langSelected);
      }
      this.langSelected = langSelected;
    },
    selectLanguage: async function (event) {
      if (!this.languageExists(this.langSelected)) {
        this.pushLog(`Error: language ${langSelected} does not exist.`);
      }
      this.pushLog(`Selecting language: ${this.langSelected}`);
      window.localStorage.setItem("language", this.langSelected);
      this.richTexts = [];
      this.renderedText = "";
      await this.loadTexts();
    },
    languageExists: function (lang) {
      if (!lang) {
        return false;
      }
      for (let l of this.languages) {
        if (l == lang) {
          return true;
        }
      }
      return false;
    },
    shuffle: function (array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i);
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
    },
    buildTexts: function () {
      const texts = this.originalText.split(" ");
      this.shuffle(texts);
      let wordCount = 20;
      if (this.wcSelected) {
        wordCount = this.wcSelected;
      }
      const slicedTexts = texts.slice(0, wordCount);
      for (const [index, text] of Object.entries(slicedTexts)) {
        let klass = "typing-text-normal";
        if (index == 0) {
          klass = "typing-text-prepare";
        }
        this.richTexts.push({
          text,
          klass,
        });
      }
    },
    renderText: function () {
      const html = this.richTexts
        .map((rt) => `<span class="${rt.klass}">${rt.text}</span> `)
        .join("");
      this.renderedText = html;
    },
    initFinishedTimes: function () {
      let finishedTimes = window.localStorage.getItem("finished");
      if (!finishedTimes && finishedTimes != 0) {
        finishedTimes = 0;
      }
      this.finishedTimes = finishedTimes;
    },
    formatFinishedTimes: function (t) {
      if (t == 1) {
        return "once";
      } else if (t == 2) {
        return "twice";
      } else {
        return `${t} times`;
      }
    },
    saveFinishedTimes: function () {
      window.localStorage.setItem("finished", this.finishedTimes);
    },
    loadTheme: function () {
      let theme = window.localStorage.getItem("theme");
      if (!theme) {
        theme = "nord";
      }
      this.themeName = this.getThemeClass(theme);
      this.themeSelected = theme;
    },
    selectTheme: function (event) {
      const themeName = this.getThemeClass(this.themeSelected);
      if (this.themeName == themeName) {
        return;
      }
      this.pushLog(`Selecting theme: ${this.themeSelected}`);
      this.themeName = themeName;
      window.localStorage.setItem("theme", this.themeSelected);
    },
    getThemeClass: function (name) {
      return `theme theme-${name}`;
    },
    loadWordCount: function () {
      let wordCount = window.localStorage.getItem("wordCount");
      if (!wordCount) {
        wordCount = 20;
      }
      this.wcSelected = wordCount;
    },
    selectWordCount: function (event) {
      window.localStorage.setItem("wordCount", this.wcSelected);
      this.pushLog(`Selecting word count: ${this.wcSelected}`);
      this.pushLog("Restarting...");
      this.initVars();
      this.buildTexts();
      this.renderText();
    },
    isPunctuation: function (c) {
      switch (c) {
        case " ":
          return true;
        default:
          return false;
      }
    },
    restart: function () {
      this.resetLog();
      this.pushLog("Restarting...");
      this.initVars();
      this.buildTexts();
      this.renderText();
      this.$refs.typing.focus();
    },
    pushLog: function (s) {
      this.logs.push(s);
      if (this.logs > 5000) {
        this.logs.splice(0, 2000);
      }
      this.logOutput = this.logs.join("\n");
    },
    resetLog: function () {
      this.logs = [];
      this.logOutput = "";
    },
  },
});
