package com.singh0883.transnovamobile;

import android.graphics.Color;
import android.inputmethodservice.InputMethodService;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import org.json.JSONArray;

public class TransNovaKeyboardService extends InputMethodService {

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private String currentMode = "HI_TO_EN"; // "HI_TO_EN" or "EN_TO_HI"
    private String currentKeyboardMode = "QWERTY"; // "QWERTY", "DEVANAGARI", "SYMBOLS"

    private LinearLayout mainKeyboardContainer;
    private Button modeToggleBtn;
    private TextView statusText;

    @Override
    public View onCreateInputView() {
        LinearLayout rootLayout = new LinearLayout(this);
        rootLayout.setOrientation(LinearLayout.VERTICAL);
        rootLayout.setBackgroundColor(Color.parseColor("#090D16"));
        rootLayout.setPadding(6, 6, 6, 10);
        rootLayout.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        // Top Toolbar
        LinearLayout topToolbar = new LinearLayout(this);
        topToolbar.setOrientation(LinearLayout.HORIZONTAL);
        topToolbar.setGravity(Gravity.CENTER_VERTICAL);
        topToolbar.setBackgroundColor(Color.parseColor("#0F172A"));
        topToolbar.setPadding(10, 8, 10, 8);
        LinearLayout.LayoutParams toolbarParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        toolbarParams.setMargins(0, 0, 0, 6);
        topToolbar.setLayoutParams(toolbarParams);

        statusText = new TextView(this);
        statusText.setText("🌐 TransNova System Keyboard");
        statusText.setTextColor(Color.parseColor("#38BDF8"));
        statusText.setTextSize(12.5f);
        statusText.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        modeToggleBtn = new Button(this);
        modeToggleBtn.setText("HI ➔ EN");
        modeToggleBtn.setTextColor(Color.parseColor("#38BDF8"));
        modeToggleBtn.setBackgroundColor(Color.parseColor("#1E293B"));
        modeToggleBtn.setTextSize(11f);
        modeToggleBtn.setPadding(12, 0, 12, 0);
        LinearLayout.LayoutParams toggleParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            80
        );
        toggleParams.setMargins(0, 0, 6, 0);
        modeToggleBtn.setLayoutParams(toggleParams);
        modeToggleBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if ("HI_TO_EN".equals(currentMode)) {
                    currentMode = "EN_TO_HI";
                    modeToggleBtn.setText("EN ➔ HI");
                    statusText.setText("🌐 TransNova (English ➔ Hindi)");
                } else {
                    currentMode = "HI_TO_EN";
                    modeToggleBtn.setText("HI ➔ EN");
                    statusText.setText("🌐 TransNova (Hindi/Hinglish ➔ English)");
                }
            }
        });

        Button switchKeyBtn = new Button(this);
        switchKeyBtn.setText("⌨️ Switch");
        switchKeyBtn.setTextColor(Color.WHITE);
        switchKeyBtn.setBackgroundColor(Color.parseColor("#334155"));
        switchKeyBtn.setTextSize(11f);
        switchKeyBtn.setPadding(12, 0, 12, 0);
        switchKeyBtn.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            80
        ));
        switchKeyBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
                    if (imm != null) {
                        imm.showInputMethodPicker();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        topToolbar.addView(statusText);
        topToolbar.addView(modeToggleBtn);
        topToolbar.addView(switchKeyBtn);
        rootLayout.addView(topToolbar);

        mainKeyboardContainer = new LinearLayout(this);
        mainKeyboardContainer.setOrientation(LinearLayout.VERTICAL);
        mainKeyboardContainer.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ));
        rootLayout.addView(mainKeyboardContainer);

        renderKeyboardLayout();

        return rootLayout;
    }

    private void renderKeyboardLayout() {
        if (mainKeyboardContainer == null) return;
        mainKeyboardContainer.removeAllViews();

        if ("DEVANAGARI".equals(currentKeyboardMode)) {
            renderDevanagariLayout(mainKeyboardContainer);
        } else if ("SYMBOLS".equals(currentKeyboardMode)) {
            renderSymbolsLayout(mainKeyboardContainer);
        } else {
            renderQwertyLayout(mainKeyboardContainer);
        }

        // Bottom Bar
        LinearLayout bottomRow = new LinearLayout(this);
        bottomRow.setOrientation(LinearLayout.HORIZONTAL);
        bottomRow.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams bottomParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        bottomParams.setMargins(0, 6, 0, 0);
        bottomRow.setLayoutParams(bottomParams);

        Button layoutToggleBtn = new Button(this);
        layoutToggleBtn.setText("QWERTY".equals(currentKeyboardMode) ? "🇮🇳 HI" : "ABC");
        layoutToggleBtn.setTextColor(Color.WHITE);
        layoutToggleBtn.setBackgroundColor(Color.parseColor("#334155"));
        layoutToggleBtn.setTextSize(13f);
        LinearLayout.LayoutParams layoutParams = new LinearLayout.LayoutParams(0, 110, 1.5f);
        layoutParams.setMargins(2, 0, 2, 0);
        layoutToggleBtn.setLayoutParams(layoutParams);
        layoutToggleBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                currentKeyboardMode = "QWERTY".equals(currentKeyboardMode) ? "DEVANAGARI" : "QWERTY";
                renderKeyboardLayout();
            }
        });

        Button symbolToggleBtn = new Button(this);
        symbolToggleBtn.setText("SYMBOLS".equals(currentKeyboardMode) ? "ABC" : "?123");
        symbolToggleBtn.setTextColor(Color.WHITE);
        symbolToggleBtn.setBackgroundColor(Color.parseColor("#334155"));
        symbolToggleBtn.setTextSize(13f);
        LinearLayout.LayoutParams symParams = new LinearLayout.LayoutParams(0, 110, 1.5f);
        symParams.setMargins(2, 0, 2, 0);
        symbolToggleBtn.setLayoutParams(symParams);
        symbolToggleBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                currentKeyboardMode = "SYMBOLS".equals(currentKeyboardMode) ? "QWERTY" : "SYMBOLS";
                renderKeyboardLayout();
            }
        });

        Button spaceBtn = new Button(this);
        spaceBtn.setText("Space");
        spaceBtn.setTextColor(Color.WHITE);
        spaceBtn.setBackgroundColor(Color.parseColor("#1E293B"));
        spaceBtn.setTextSize(14f);
        LinearLayout.LayoutParams spaceParams = new LinearLayout.LayoutParams(0, 110, 4f);
        spaceParams.setMargins(2, 0, 2, 0);
        spaceBtn.setLayoutParams(spaceParams);
        spaceBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null) ic.commitText(" ", 1);
            }
        });

        Button translateBtn = new Button(this);
        translateBtn.setText("🌐 Translate");
        translateBtn.setTextColor(Color.WHITE);
        translateBtn.setBackgroundColor(Color.parseColor("#2563EB"));
        translateBtn.setTextSize(13f);
        LinearLayout.LayoutParams transParams = new LinearLayout.LayoutParams(0, 110, 3.5f);
        transParams.setMargins(2, 0, 2, 0);
        translateBtn.setLayoutParams(transParams);
        translateBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                performTranslationAndCommit();
            }
        });

        bottomRow.addView(layoutToggleBtn);
        bottomRow.addView(symbolToggleBtn);
        bottomRow.addView(spaceBtn);
        bottomRow.addView(translateBtn);
        mainKeyboardContainer.addView(bottomRow);
    }

    private void renderQwertyLayout(LinearLayout container) {
        String[][] rows = new String[][]{
            {"q", "w", "e", "r", "t", "y", "u", "i", "o", "p"},
            {"a", "s", "d", "f", "g", "h", "j", "k", "l"},
            {"z", "x", "c", "v", "b", "n", "m", "⌫"}
        };

        for (String[] row : rows) {
            LinearLayout rowLayout = new LinearLayout(this);
            rowLayout.setOrientation(LinearLayout.HORIZONTAL);
            rowLayout.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            );
            rowParams.setMargins(0, 3, 0, 3);
            rowLayout.setLayoutParams(rowParams);

            for (final String key : row) {
                Button keyBtn = new Button(this);
                keyBtn.setText(key);
                keyBtn.setTextColor(Color.WHITE);
                keyBtn.setTextSize(16f);
                keyBtn.setBackgroundColor("⌫".equals(key) ? Color.parseColor("#DC2626") : Color.parseColor("#1E293B"));
                float weightVal = "⌫".equals(key) ? 1.5f : 1f;
                LinearLayout.LayoutParams keyParams = new LinearLayout.LayoutParams(0, 105, weightVal);
                keyParams.setMargins(2, 0, 2, 0);
                keyBtn.setLayoutParams(keyParams);

                keyBtn.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        InputConnection ic = getCurrentInputConnection();
                        if (ic == null) return;
                        if ("⌫".equals(key)) {
                            ic.deleteSurroundingText(1, 0);
                        } else {
                            ic.commitText(key, 1);
                        }
                    }
                });
                rowLayout.addView(keyBtn);
            }
            container.addView(rowLayout);
        }
    }

    private void renderDevanagariLayout(LinearLayout container) {
        String[][] rows = new String[][]{
            {"अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ऐ", "ओ", "औ"},
            {"क", "ख", "ग", "घ", "च", "छ", "ज", "झ", "ट", "ठ"},
            {"त", "थ", "द", "ध", "न", "प", "फ", "ब", "भ", "म"},
            {"य", "र", "ल", "व", "श", "ष", "स", "ह", "⌫"}
        };

        for (String[] row : rows) {
            LinearLayout rowLayout = new LinearLayout(this);
            rowLayout.setOrientation(LinearLayout.HORIZONTAL);
            rowLayout.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            );
            rowParams.setMargins(0, 3, 0, 3);
            rowLayout.setLayoutParams(rowParams);

            for (final String key : row) {
                Button keyBtn = new Button(this);
                keyBtn.setText(key);
                keyBtn.setTextColor(Color.WHITE);
                keyBtn.setTextSize(15f);
                keyBtn.setBackgroundColor("⌫".equals(key) ? Color.parseColor("#DC2626") : Color.parseColor("#1E293B"));
                float weightVal = "⌫".equals(key) ? 1.5f : 1f;
                LinearLayout.LayoutParams keyParams = new LinearLayout.LayoutParams(0, 105, weightVal);
                keyParams.setMargins(2, 0, 2, 0);
                keyBtn.setLayoutParams(keyParams);

                keyBtn.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        InputConnection ic = getCurrentInputConnection();
                        if (ic == null) return;
                        if ("⌫".equals(key)) {
                            ic.deleteSurroundingText(1, 0);
                        } else {
                            ic.commitText(key, 1);
                        }
                    }
                });
                rowLayout.addView(keyBtn);
            }
            container.addView(rowLayout);
        }
    }

    private void renderSymbolsLayout(LinearLayout container) {
        String[][] rows = new String[][]{
            {"1", "2", "3", "4", "5", "6", "7", "8", "9", "0"},
            {"@", "#", "$", "%", "&", "-", "+", "(", ")", "/"},
            {"*", "\"", "'", ":", ";", "!", "?", ",", ".", "⌫"}
        };

        for (String[] row : rows) {
            LinearLayout rowLayout = new LinearLayout(this);
            rowLayout.setOrientation(LinearLayout.HORIZONTAL);
            rowLayout.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            );
            rowParams.setMargins(0, 3, 0, 3);
            rowLayout.setLayoutParams(rowParams);

            for (final String key : row) {
                Button keyBtn = new Button(this);
                keyBtn.setText(key);
                keyBtn.setTextColor(Color.WHITE);
                keyBtn.setTextSize(16f);
                keyBtn.setBackgroundColor("⌫".equals(key) ? Color.parseColor("#DC2626") : Color.parseColor("#1E293B"));
                float weightVal = "⌫".equals(key) ? 1.5f : 1f;
                LinearLayout.LayoutParams keyParams = new LinearLayout.LayoutParams(0, 105, weightVal);
                keyParams.setMargins(2, 0, 2, 0);
                keyBtn.setLayoutParams(keyParams);

                keyBtn.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        InputConnection ic = getCurrentInputConnection();
                        if (ic == null) return;
                        if ("⌫".equals(key)) {
                            ic.deleteSurroundingText(1, 0);
                        } else {
                            ic.commitText(key, 1);
                        }
                    }
                });
                rowLayout.addView(keyBtn);
            }
            container.addView(rowLayout);
        }
    }

    private void performTranslationAndCommit() {
        final InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;

        CharSequence textBeforeCs = ic.getTextBeforeCursor(300, 0);
        final String textBefore = (textBeforeCs != null) ? textBeforeCs.toString() : "";

        if (textBefore.trim().isEmpty()) return;

        final String sourceLang = "HI_TO_EN".equals(currentMode) ? "hi" : "en";
        final String targetLang = "HI_TO_EN".equals(currentMode) ? "en" : "hi";

        if (statusText != null) {
            statusText.setText("🌐 Translating...");
        }

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    String encoded = URLEncoder.encode(textBefore.trim(), "UTF-8");
                    String apiUrl = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=" + sourceLang + "&tl=" + targetLang + "&q=" + encoded;
                    URL url = new URL(apiUrl);
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setRequestMethod("GET");
                    connection.setConnectTimeout(4000);
                    connection.setReadTimeout(4000);

                    if (connection.getResponseCode() == 200) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                        StringBuilder sbResponse = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) {
                            sbResponse.append(line);
                        }
                        reader.close();

                        JSONArray jsonArray = new JSONArray(sbResponse.toString());
                        JSONArray outerArr = jsonArray.getJSONArray(0);
                        StringBuilder sbTrans = new StringBuilder();
                        for (int i = 0; i < outerArr.length(); i++) {
                            String piece = outerArr.getJSONArray(i).getString(0);
                            sbTrans.append(piece);
                        }
                        final String translatedText = sbTrans.toString();

                        mainHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                if (translatedText != null && !translatedText.trim().isEmpty()) {
                                    ic.deleteSurroundingText(textBefore.length(), 0);
                                    ic.commitText(translatedText, 1);
                                    if (statusText != null) {
                                        statusText.setText("HI_TO_EN".equals(currentMode) ? "🌐 TransNova (HI ➔ EN)" : "🌐 TransNova (EN ➔ HI)");
                                    }
                                }
                            }
                        });
                    } else {
                        mainHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                if (statusText != null) statusText.setText("🌐 TransNova Ready");
                            }
                        });
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    mainHandler.post(new Runnable() {
                        @Override
                        public void run() {
                            if (statusText != null) statusText.setText("🌐 TransNova Ready");
                        }
                    });
                }
            }
        }).start();
    }
}
