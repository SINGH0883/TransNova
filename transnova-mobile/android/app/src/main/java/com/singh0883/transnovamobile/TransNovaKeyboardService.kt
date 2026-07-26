package com.singh0883.transnovamobile

import android.graphics.Color
import android.inputmethodservice.InputMethodService
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import kotlinx.coroutines.*
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import org.json.JSONArray

class TransNovaKeyboardService : InputMethodService() {

    private val serviceScope = CoroutineScope(Dispatchers.Main + Job())
    private var currentMode = "HI_TO_EN" // "HI_TO_EN" or "EN_TO_HI"
    private var currentKeyboardMode = "QWERTY" // "QWERTY", "DEVANAGARI", "SYMBOLS"

    private lateinit var mainKeyboardContainer: LinearLayout
    private lateinit var modeToggleBtn: Button
    private lateinit var statusText: TextView

    override fun onCreateInputView(): View {
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#090D16"))
            setPadding(6, 6, 6, 10)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        // Top Gboard-style Action & Toolbar
        val topToolbar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setBackgroundColor(Color.parseColor("#0F172A"))
            setPadding(10, 8, 10, 8)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 0, 6) }
        }

        statusText = TextView(this).apply {
            text = "🌐 TransNova System Keyboard"
            setTextColor(Color.parseColor("#38BDF8"))
            textSize = 12.5f
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        modeToggleBtn = Button(this).apply {
            text = "HI ➔ EN"
            setTextColor(Color.parseColor("#38BDF8"))
            setBackgroundColor(Color.parseColor("#1E293B"))
            textSize = 11f
            setPadding(12, 0, 12, 0)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                80
            ).apply { setMargins(0, 0, 6, 0) }
            setOnClickListener {
                if (currentMode == "HI_TO_EN") {
                    currentMode = "EN_TO_HI"
                    text = "EN ➔ HI"
                    statusText.text = "🌐 TransNova (English ➔ Hindi)"
                } else {
                    currentMode = "HI_TO_EN"
                    text = "HI ➔ EN"
                    statusText.text = "🌐 TransNova (Hindi/Hinglish ➔ English)"
                }
            }
        }

        val switchKeyBtn = Button(this).apply {
            text = "⌨️ Switch"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#334155"))
            textSize = 11f
            setPadding(12, 0, 12, 0)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                80
            )
            setOnClickListener {
                val imm = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
                imm.showInputMethodPicker()
            }
        }

        topToolbar.addView(statusText)
        topToolbar.addView(modeToggleBtn)
        topToolbar.addView(switchKeyBtn)
        rootLayout.addView(topToolbar)

        // Main Keyboard Container
        mainKeyboardContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }
        rootLayout.addView(mainKeyboardContainer)

        renderKeyboardLayout()

        return rootLayout
    }

    private fun renderKeyboardLayout() {
        mainKeyboardContainer.removeAllViews()

        when (currentKeyboardMode) {
            "DEVANAGARI" -> renderDevanagariLayout()
            "SYMBOLS" -> renderSymbolsLayout()
            else -> renderQwertyLayout()
        }

        // Bottom Bar with Spacebar & Translate Button
        val bottomRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 6, 0, 0) }
        }

        val layoutToggleBtn = Button(this).apply {
            text = if (currentKeyboardMode == "QWERTY") "🇮🇳 HI" else "ABC"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#334155"))
            textSize = 13f
            layoutParams = LinearLayout.LayoutParams(0, 110, 1.5f).apply { setMargins(2, 0, 2, 0) }
            setOnClickListener {
                currentKeyboardMode = if (currentKeyboardMode == "QWERTY") "DEVANAGARI" else "QWERTY"
                renderKeyboardLayout()
            }
        }

        val symbolToggleBtn = Button(this).apply {
            text = if (currentKeyboardMode == "SYMBOLS") "ABC" else "?123"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#334155"))
            textSize = 13f
            layoutParams = LinearLayout.LayoutParams(0, 110, 1.5f).apply { setMargins(2, 0, 2, 0) }
            setOnClickListener {
                currentKeyboardMode = if (currentKeyboardMode == "SYMBOLS") "QWERTY" else "SYMBOLS"
                renderKeyboardLayout()
            }
        }

        val spaceBtn = Button(this).apply {
            text = "Space"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#1E293B"))
            textSize = 14f
            layoutParams = LinearLayout.LayoutParams(0, 110, 4f).apply { setMargins(2, 0, 2, 0) }
            setOnClickListener {
                currentInputConnection?.commitText(" ", 1)
            }
        }

        val translateBtn = Button(this).apply {
            text = "🌐 Translate"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#2563EB"))
            textSize = 13f
            layoutParams = LinearLayout.LayoutParams(0, 110, 3.5f).apply { setMargins(2, 0, 2, 0) }
            setOnClickListener {
                performTranslationAndCommit()
            }
        }

        bottomRow.addView(layoutToggleBtn)
        bottomRow.addView(symbolToggleBtn)
        bottomRow.addView(spaceBtn)
        bottomRow.addView(translateBtn)
        mainKeyboardContainer.addView(bottomRow)
    }

    private fun renderQwertyLayout() {
        val rows = arrayOf(
            arrayOf("q", "w", "e", "r", "t", "y", "u", "i", "o", "p"),
            arrayOf("a", "s", "d", "f", "g", "h", "j", "k", "l"),
            arrayOf("z", "x", "c", "v", "b", "n", "m", "⌫")
        )

        for (row in rows) {
            val rowLayout = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { setMargins(0, 3, 0, 3) }
            }

            for (key in row) {
                val keyBtn = Button(this).apply {
                    text = key
                    setTextColor(Color.WHITE)
                    textSize = 16f
                    setBackgroundColor(if (key == "⌫") Color.parseColor("#DC2626") else Color.parseColor("#1E293B"))
                    val weightVal = if (key == "⌫") 1.5f else 1f
                    layoutParams = LinearLayout.LayoutParams(0, 105, weightVal).apply {
                        setMargins(2, 0, 2, 0)
                    }

                    setOnClickListener {
                        val inputConn = currentInputConnection ?: return@setOnClickListener
                        if (key == "⌫") {
                            inputConn.deleteSurroundingText(1, 0)
                        } else {
                            inputConn.commitText(key, 1)
                        }
                    }
                }
                rowLayout.addView(keyBtn)
            }
            mainKeyboardContainer.addView(rowLayout)
        }
    }

    private fun renderDevanagariLayout() {
        val rows = arrayOf(
            arrayOf("अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ऐ", "ओ", "औ"),
            arrayOf("क", "ख", "ग", "घ", "च", "छ", "ज", "झ", "ट", "ठ"),
            arrayOf("त", "थ", "द", "ध", "न", "प", "फ", "ब", "भ", "म"),
            arrayOf("य", "र", "ल", "व", "श", "ष", "स", "ह", "⌫")
        )

        for (row in rows) {
            val rowLayout = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { setMargins(0, 3, 0, 3) }
            }

            for (key in row) {
                val keyBtn = Button(this).apply {
                    text = key
                    setTextColor(Color.WHITE)
                    textSize = 15f
                    setBackgroundColor(if (key == "⌫") Color.parseColor("#DC2626") else Color.parseColor("#1E293B"))
                    val weightVal = if (key == "⌫") 1.5f else 1f
                    layoutParams = LinearLayout.LayoutParams(0, 105, weightVal).apply {
                        setMargins(2, 0, 2, 0)
                    }

                    setOnClickListener {
                        val inputConn = currentInputConnection ?: return@setOnClickListener
                        if (key == "⌫") {
                            inputConn.deleteSurroundingText(1, 0)
                        } else {
                            inputConn.commitText(key, 1)
                        }
                    }
                }
                rowLayout.addView(keyBtn)
            }
            mainKeyboardContainer.addView(rowLayout)
        }
    }

    private fun renderSymbolsLayout() {
        val rows = arrayOf(
            arrayOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "0"),
            arrayOf("@", "#", "$", "%", "&", "-", "+", "(", ")", "/"),
            arrayOf("*", "\"", "'", ":", ";", "!", "?", ",", ".", "⌫")
        )

        for (row in rows) {
            val rowLayout = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { setMargins(0, 3, 0, 3) }
            }

            for (key in row) {
                val keyBtn = Button(this).apply {
                    text = key
                    setTextColor(Color.WHITE)
                    textSize = 16f
                    setBackgroundColor(if (key == "⌫") Color.parseColor("#DC2626") else Color.parseColor("#1E293B"))
                    val weightVal = if (key == "⌫") 1.5f else 1f
                    layoutParams = LinearLayout.LayoutParams(0, 105, weightVal).apply {
                        setMargins(2, 0, 2, 0)
                    }

                    setOnClickListener {
                        val inputConn = currentInputConnection ?: return@setOnClickListener
                        if (key == "⌫") {
                            inputConn.deleteSurroundingText(1, 0)
                        } else {
                            inputConn.commitText(key, 1)
                        }
                    }
                }
                rowLayout.addView(keyBtn)
            }
            mainKeyboardContainer.addView(rowLayout)
        }
    }

    private fun performTranslationAndCommit() {
        val inputConn = currentInputConnection ?: return
        val textBefore = inputConn.getTextBeforeCursor(300, 0)?.toString() ?: ""

        if (textBefore.isBlank()) return

        val sourceLang = if (currentMode == "HI_TO_EN") "hi" else "en"
        val targetLang = if (currentMode == "HI_TO_EN") "en" else "hi"

        statusText.text = "🌐 Translating..."

        serviceScope.launch(Dispatchers.IO) {
            try {
                val encoded = URLEncoder.encode(textBefore.trim(), "UTF-8")
                val apiUrl = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=$sourceLang&tl=$targetLang&q=$encoded"
                val url = URL(apiUrl)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.connectTimeout = 4000
                connection.readTimeout = 4000

                if (connection.responseCode == 200) {
                    val responseStr = connection.inputStream.bufferedReader().use { it.readText() }
                    val jsonArray = JSONArray(responseStr)
                    val outerArr = jsonArray.getJSONArray(0)
                    val sb = StringBuilder()
                    for (i in 0 until outerArr.length()) {
                        val piece = outerArr.getJSONArray(i).getString(0)
                        sb.append(piece)
                    }
                    val translatedText = sb.toString()

                    withContext(Dispatchers.Main) {
                        if (translatedText.isNotBlank()) {
                            inputConn.deleteSurroundingText(textBefore.length, 0)
                            inputConn.commitText(translatedText, 1)
                            statusText.text = if (currentMode == "HI_TO_EN") "🌐 TransNova (HI ➔ EN)" else "🌐 TransNova (EN ➔ HI)"
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    statusText.text = "🌐 TransNova Ready"
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }
}
