package com.singh0883.transnovamobile

import android.graphics.Color
import android.inputmethodservice.InputMethodService
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import org.json.JSONArray

class TransNovaKeyboardService : InputMethodService() {

    private val mainHandler = Handler(Looper.getMainLooper())
    private var currentMode = "HI_TO_EN"
    private var currentKeyboardMode = "QWERTY"

    private var mainKeyboardContainer: LinearLayout? = null
    private var modeToggleBtn: Button? = null
    private var statusText: TextView? = null

    override fun onCreateInputView(): View {
        val rootLayout = LinearLayout(this)
        rootLayout.orientation = LinearLayout.VERTICAL
        rootLayout.setBackgroundColor(Color.parseColor("#090D16"))
        rootLayout.setPadding(6, 6, 6, 10)
        rootLayout.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )

        // Top Toolbar
        val topToolbar = LinearLayout(this)
        topToolbar.orientation = LinearLayout.HORIZONTAL
        topToolbar.gravity = Gravity.CENTER_VERTICAL
        topToolbar.setBackgroundColor(Color.parseColor("#0F172A"))
        topToolbar.setPadding(10, 8, 10, 8)
        val toolbarParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )
        toolbarParams.setMargins(0, 0, 0, 6)
        topToolbar.layoutParams = toolbarParams

        val statusTv = TextView(this)
        statusTv.text = "🌐 TransNova System Keyboard"
        statusTv.setTextColor(Color.parseColor("#38BDF8"))
        statusTv.textSize = 12.5f
        statusTv.layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        statusText = statusTv

        val toggleBtn = Button(this)
        toggleBtn.text = "HI ➔ EN"
        toggleBtn.setTextColor(Color.parseColor("#38BDF8"))
        toggleBtn.setBackgroundColor(Color.parseColor("#1E293B"))
        toggleBtn.textSize = 11f
        toggleBtn.setPadding(12, 0, 12, 0)
        val toggleParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            80
        )
        toggleParams.setMargins(0, 0, 6, 0)
        toggleBtn.layoutParams = toggleParams
        toggleBtn.setOnClickListener {
            if (currentMode == "HI_TO_EN") {
                currentMode = "EN_TO_HI"
                toggleBtn.text = "EN ➔ HI"
                statusText?.text = "🌐 TransNova (English ➔ Hindi)"
            } else {
                currentMode = "HI_TO_EN"
                toggleBtn.text = "HI ➔ EN"
                statusText?.text = "🌐 TransNova (Hindi/Hinglish ➔ English)"
            }
        }
        modeToggleBtn = toggleBtn

        val switchKeyBtn = Button(this)
        switchKeyBtn.text = "⌨️ Switch"
        switchKeyBtn.setTextColor(Color.WHITE)
        switchKeyBtn.setBackgroundColor(Color.parseColor("#334155"))
        switchKeyBtn.textSize = 11f
        switchKeyBtn.setPadding(12, 0, 12, 0)
        switchKeyBtn.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            80
        )
        switchKeyBtn.setOnClickListener {
            try {
                val imm = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
                imm.showInputMethodPicker()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        topToolbar.addView(statusTv)
        topToolbar.addView(toggleBtn)
        topToolbar.addView(switchKeyBtn)
        rootLayout.addView(topToolbar)

        val container = LinearLayout(this)
        container.orientation = LinearLayout.VERTICAL
        container.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )
        mainKeyboardContainer = container
        rootLayout.addView(container)

        renderKeyboardLayout()

        return rootLayout
    }

    private fun renderKeyboardLayout() {
        val container = mainKeyboardContainer ?: return
        container.removeAllViews()

        when (currentKeyboardMode) {
            "DEVANAGARI" -> renderDevanagariLayout(container)
            "SYMBOLS" -> renderSymbolsLayout(container)
            else -> renderQwertyLayout(container)
        }

        // Bottom Bar
        val bottomRow = LinearLayout(this)
        bottomRow.orientation = LinearLayout.HORIZONTAL
        bottomRow.gravity = Gravity.CENTER
        val bottomParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )
        bottomParams.setMargins(0, 6, 0, 0)
        bottomRow.layoutParams = bottomParams

        val layoutToggleBtn = Button(this)
        layoutToggleBtn.text = if (currentKeyboardMode == "QWERTY") "🇮🇳 HI" else "ABC"
        layoutToggleBtn.setTextColor(Color.WHITE)
        layoutToggleBtn.setBackgroundColor(Color.parseColor("#334155"))
        layoutToggleBtn.textSize = 13f
        val layoutParams = LinearLayout.LayoutParams(0, 110, 1.5f)
        layoutParams.setMargins(2, 0, 2, 0)
        layoutToggleBtn.layoutParams = layoutParams
        layoutToggleBtn.setOnClickListener {
            currentKeyboardMode = if (currentKeyboardMode == "QWERTY") "DEVANAGARI" else "QWERTY"
            renderKeyboardLayout()
        }

        val symbolToggleBtn = Button(this)
        symbolToggleBtn.text = if (currentKeyboardMode == "SYMBOLS") "ABC" else "?123"
        symbolToggleBtn.setTextColor(Color.WHITE)
        symbolToggleBtn.setBackgroundColor(Color.parseColor("#334155"))
        symbolToggleBtn.textSize = 13f
        val symParams = LinearLayout.LayoutParams(0, 110, 1.5f)
        symParams.setMargins(2, 0, 2, 0)
        symbolToggleBtn.layoutParams = symParams
        symbolToggleBtn.setOnClickListener {
            currentKeyboardMode = if (currentKeyboardMode == "SYMBOLS") "QWERTY" else "SYMBOLS"
            renderKeyboardLayout()
        }

        val spaceBtn = Button(this)
        spaceBtn.text = "Space"
        spaceBtn.setTextColor(Color.WHITE)
        spaceBtn.setBackgroundColor(Color.parseColor("#1E293B"))
        spaceBtn.textSize = 14f
        val spaceParams = LinearLayout.LayoutParams(0, 110, 4f)
        spaceParams.setMargins(2, 0, 2, 0)
        spaceBtn.layoutParams = spaceParams
        spaceBtn.setOnClickListener {
            currentInputConnection?.commitText(" ", 1)
        }

        val translateBtn = Button(this)
        translateBtn.text = "🌐 Translate"
        translateBtn.setTextColor(Color.WHITE)
        translateBtn.setBackgroundColor(Color.parseColor("#2563EB"))
        translateBtn.textSize = 13f
        val transParams = LinearLayout.LayoutParams(0, 110, 3.5f)
        transParams.setMargins(2, 0, 2, 0)
        translateBtn.layoutParams = transParams
        translateBtn.setOnClickListener {
            performTranslationAndCommit()
        }

        bottomRow.addView(layoutToggleBtn)
        bottomRow.addView(symbolToggleBtn)
        bottomRow.addView(spaceBtn)
        bottomRow.addView(translateBtn)
        container.addView(bottomRow)
    }

    private fun renderQwertyLayout(container: LinearLayout) {
        val rows = arrayOf(
            arrayOf("q", "w", "e", "r", "t", "y", "u", "i", "o", "p"),
            arrayOf("a", "s", "d", "f", "g", "h", "j", "k", "l"),
            arrayOf("z", "x", "c", "v", "b", "n", "m", "⌫")
        )

        for (row in rows) {
            val rowLayout = LinearLayout(this)
            rowLayout.orientation = LinearLayout.HORIZONTAL
            rowLayout.gravity = Gravity.CENTER
            val rowParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            rowParams.setMargins(0, 3, 0, 3)
            rowLayout.layoutParams = rowParams

            for (key in row) {
                val keyBtn = Button(this)
                keyBtn.text = key
                keyBtn.setTextColor(Color.WHITE)
                keyBtn.textSize = 16f
                keyBtn.setBackgroundColor(if (key == "⌫") Color.parseColor("#DC2626") else Color.parseColor("#1E293B"))
                val weightVal = if (key == "⌫") 1.5f else 1f
                val keyParams = LinearLayout.LayoutParams(0, 105, weightVal)
                keyParams.setMargins(2, 0, 2, 0)
                keyBtn.layoutParams = keyParams

                keyBtn.setOnClickListener {
                    val inputConn = currentInputConnection ?: return@setOnClickListener
                    if (key == "⌫") {
                        inputConn.deleteSurroundingText(1, 0)
                    } else {
                        inputConn.commitText(key, 1)
                    }
                }
                rowLayout.addView(keyBtn)
            }
            container.addView(rowLayout)
        }
    }

    private fun renderDevanagariLayout(container: LinearLayout) {
        val rows = arrayOf(
            arrayOf("अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ऐ", "ओ", "औ"),
            arrayOf("क", "ख", "ग", "घ", "च", "छ", "ज", "झ", "ट", "ठ"),
            arrayOf("त", "थ", "द", "ध", "न", "प", "फ", "ब", "भ", "म"),
            arrayOf("य", "र", "ल", "व", "श", "ष", "स", "ह", "⌫")
        )

        for (row in rows) {
            val rowLayout = LinearLayout(this)
            rowLayout.orientation = LinearLayout.HORIZONTAL
            rowLayout.gravity = Gravity.CENTER
            val rowParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            rowParams.setMargins(0, 3, 0, 3)
            rowLayout.layoutParams = rowParams

            for (key in row) {
                val keyBtn = Button(this)
                keyBtn.text = key
                keyBtn.setTextColor(Color.WHITE)
                keyBtn.textSize = 15f
                keyBtn.setBackgroundColor(if (key == "⌫") Color.parseColor("#DC2626") else Color.parseColor("#1E293B"))
                val weightVal = if (key == "⌫") 1.5f else 1f
                val keyParams = LinearLayout.LayoutParams(0, 105, weightVal)
                keyParams.setMargins(2, 0, 2, 0)
                keyBtn.layoutParams = keyParams

                keyBtn.setOnClickListener {
                    val inputConn = currentInputConnection ?: return@setOnClickListener
                    if (key == "⌫") {
                        inputConn.deleteSurroundingText(1, 0)
                    } else {
                        inputConn.commitText(key, 1)
                    }
                }
                rowLayout.addView(keyBtn)
            }
            container.addView(rowLayout)
        }
    }

    private fun renderSymbolsLayout(container: LinearLayout) {
        val rows = arrayOf(
            arrayOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "0"),
            arrayOf("@", "#", "$", "%", "&", "-", "+", "(", ")", "/"),
            arrayOf("*", "\"", "'", ":", ";", "!", "?", ",", ".", "⌫")
        )

        for (row in rows) {
            val rowLayout = LinearLayout(this)
            rowLayout.orientation = LinearLayout.HORIZONTAL
            rowLayout.gravity = Gravity.CENTER
            val rowParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            rowParams.setMargins(0, 3, 0, 3)
            rowLayout.layoutParams = rowParams

            for (key in row) {
                val keyBtn = Button(this)
                keyBtn.text = key
                keyBtn.setTextColor(Color.WHITE)
                keyBtn.textSize = 16f
                keyBtn.setBackgroundColor(if (key == "⌫") Color.parseColor("#DC2626") else Color.parseColor("#1E293B"))
                val weightVal = if (key == "⌫") 1.5f else 1f
                val keyParams = LinearLayout.LayoutParams(0, 105, weightVal)
                keyParams.setMargins(2, 0, 2, 0)
                keyBtn.layoutParams = keyParams

                keyBtn.setOnClickListener {
                    val inputConn = currentInputConnection ?: return@setOnClickListener
                    if (key == "⌫") {
                        inputConn.deleteSurroundingText(1, 0)
                    } else {
                        inputConn.commitText(key, 1)
                    }
                }
                rowLayout.addView(keyBtn)
            }
            container.addView(rowLayout)
        }
    }

    private fun performTranslationAndCommit() {
        val inputConn = currentInputConnection ?: return
        val textBefore = inputConn.getTextBeforeCursor(300, 0)?.toString() ?: ""

        if (textBefore.isBlank()) return

        val sourceLang = if (currentMode == "HI_TO_EN") "hi" else "en"
        val targetLang = if (currentMode == "HI_TO_EN") "en" else "hi"

        statusText?.text = "🌐 Translating..."

        Thread {
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

                    mainHandler.post {
                        if (translatedText.isNotBlank()) {
                            inputConn.deleteSurroundingText(textBefore.length, 0)
                            inputConn.commitText(translatedText, 1)
                            statusText?.text = if (currentMode == "HI_TO_EN") "🌐 TransNova (HI ➔ EN)" else "🌐 TransNova (EN ➔ HI)"
                        }
                    }
                } else {
                    mainHandler.post {
                        statusText?.text = "🌐 TransNova Ready"
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                mainHandler.post {
                    statusText?.text = "🌐 TransNova Ready"
                }
            }
        }.start()
    }
}
