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
    ],
    themeName: "theme-minimal",
    themeSelected: "minimal",
    wcSelected: 20,
    wordCounts: [10, 20, 30, 50, 100, 200],
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
  },
  watch: {
    curTyping: function (val, oldVal) {
      if (this.finished) {
        return;
      }
      if (this.typingStart == null) {
        this.typingStart = Date.now();
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
        } else {
          this.richTexts[this.curIndex].klass = "typing-text-wrong";
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
  },
  created: async function () {
    this.initVars();
    this.loadTheme();
    this.loadWordCount();
    await this.loadTexts();
    this.buildTexts();
    this.renderText();
  },
  mounted: function () {
    this.$refs.typing.focus();
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
    },
    loadTexts: async function () {
      const response = await fetch("/texts/fixtures.json");
      const texts = await response.json();
      this.originalText = texts.english;
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
      let html = "";
      for (const rt of this.richTexts) {
        html += `<span class="${rt.klass}">${rt.text}</span> `;
      }
      this.renderedText = html;
    },
    loadTheme: function () {
      const theme = window.localStorage.getItem("theme");
      if (!theme) {
        theme = "minimal";
      }
      this.themeName = this.getThemeClass(theme);
      this.themeSelected = theme;
    },
    selectTheme: function (event) {
      const themeName = this.getThemeClass(this.themeSelected);
      if (this.themeName == themeName) {
        return;
      }
      this.themeName = themeName;
      window.localStorage.setItem("theme", this.themeSelected);
    },
    getThemeClass: function (name) {
      return `theme theme-${name}`;
    },
    loadWordCount: function () {
      const wordCount = window.localStorage.getItem("wordCount");
      if (!wordCount) {
        wordCount = 20;
      }
      this.wcSelected = wordCount;
    },
    selectWordCount: function (event) {
      window.localStorage.setItem("wordCount", this.wcSelected);
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
      this.initVars();
      this.buildTexts();
      this.renderText();
      this.$refs.typing.focus();
    },
  },
});
