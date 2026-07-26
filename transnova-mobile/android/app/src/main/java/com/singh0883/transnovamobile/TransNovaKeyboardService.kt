package com.singh0883.transnovamobile

import android.graphics.Color
import android.inputmethodservice.InputMethodService
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import kotlinx.coroutines.*
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import org.json.JSONArray

class TransNovaKeyboardService : InputMethodService() {

    private val serviceScope = CoroutineScope(Dispatchers.Main + Job())

    override fun onCreateInputView(): View {
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0F172A"))
            setPadding(8, 8, 8, 12)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        // Top Action Bar with Status and Switch Keyboard button
        val actionBar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setBackgroundColor(Color.parseColor("#1E293B"))
            setPadding(12, 8, 12, 8)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 0, 8) }
        }

        val statusText = TextView(this).apply {
            text = "🌐 TransNova Auto Hindi/Hinglish Translator"
            setTextColor(Color.parseColor("#38BDF8"))
            textSize = 13f
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val switchKeyBtn = Button(this).apply {
            text = "⌨️ Switch"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#334155"))
            textSize = 11f
            setPadding(16, 0, 16, 0)
            setOnClickListener {
                val imm = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
                imm.showInputMethodPicker()
            }
        }

        actionBar.addView(statusText)
        actionBar.addView(switchKeyBtn)
        rootLayout.addView(actionBar)

        // Keyboard Rows (QWERTY layout)
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
                ).apply { setMargins(0, 4, 0, 4) }
            }

            for (key in row) {
                val keyBtn = Button(this).apply {
                    text = key
                    setTextColor(Color.WHITE)
                    textSize = 16f
                    setBackgroundColor(if (key == "⌫") Color.parseColor("#DC2626") else Color.parseColor("#1E293B"))
                    val weightVal = if (key == "⌫") 1.5f else 1f
                    layoutParams = LinearLayout.LayoutParams(0, 110, weightVal).apply {
                        setMargins(3, 0, 3, 0)
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
            rootLayout.addView(rowLayout)
        }

        // Bottom Action Bar: Space Bar + Translate Button
        val bottomRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 6, 0, 0) }
        }

        val spaceBtn = Button(this).apply {
            text = "Space"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#1E293B"))
            textSize = 14f
            layoutParams = LinearLayout.LayoutParams(0, 115, 3f).apply { setMargins(4, 0, 4, 0) }
            setOnClickListener {
                currentInputConnection?.commitText(" ", 1)
            }
        }

        val translateBtn = Button(this).apply {
            text = "🌐 Translate & Send"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#2563EB"))
            textSize = 13f
            layoutParams = LinearLayout.LayoutParams(0, 115, 3f).apply { setMargins(4, 0, 4, 0) }
            setOnClickListener {
                performTranslationAndCommit()
            }
        }

        bottomRow.addView(spaceBtn)
        bottomRow.addView(translateBtn)
        rootLayout.addView(bottomRow)

        return rootLayout
    }

    private fun performTranslationAndCommit() {
        val inputConn = currentInputConnection ?: return
        val textBefore = inputConn.getTextBeforeCursor(300, 0)?.toString() ?: ""

        if (textBefore.isBlank()) return

        serviceScope.launch(Dispatchers.IO) {
            try {
                val encoded = URLEncoder.encode(textBefore.trim(), "UTF-8")
                val apiUrl = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=auto&tl=en&q=$encoded"
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
                            // Clear existing typed text and replace with translated English text
                            inputConn.deleteSurroundingText(textBefore.length, 0)
                            inputConn.commitText(translatedText, 1)
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }
}
