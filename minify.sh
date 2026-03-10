#!/bin/bash
# minify.sh

# We need npm install -g terser clean-css-cli html-minifier-terser before using this

DIST_DIR="dist"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

minify_css() {
  perl -0777 -pe '
    s/\/\*.*?\*\///gs;       # xóa /* comments */
    s/\s+/ /g;               # collapse whitespace
    s/ *([{};,>~+]) */$1/g; # xóa space quanh punctuation
    s/ *:\s*/:/g;            # xóa space quanh :
    s/;\s*}/}/g;             # xóa ; cuối trước } → color:red} thay vì color:red;}
    s/\(\s*/(/g;             # xóa space sau (
    s/\s*\)/)/g;             # xóa space trước )
    s/^\s+|\s+$//g;          # trim
  '
}

minify_js() {
  perl -0777 -pe '
    s/\/\*.*?\*\///gs;                      # xóa /* block comments */
    s/(?<!:)(?<!\/\/)\/\/[^\n]*//g;         # xóa // line comments, giữ http:// https://
    s/\s+/ /g;                              # collapse whitespace + newlines → 1 space
    s/ *([;,:\{\}\(\)\[\]]) */$1/g;        # xóa space quanh punctuation
    s/ *([+\-*\/%&|^]?={1,3}|=>) */$1/g;  # xóa space quanh = == === += -= => ...
    s/ *(\|\||&&|\?\?) */$1/g;             # xóa space quanh || && ??
    s/^\s+|\s+$//g;                        # trim đầu cuối
  '
}

minify_html() {
  perl -0777 -pe '
    s/<!--(?!\[).*?-->//gs;  # xóa comments, giữ <!--[if IE]--> 
    s/\s+/ /g;               # collapse whitespace → 1 space
    s/> </></g;              # xóa space giữa block tags (sau khi đã collapse)
    s/ *\/>/\/>/g;           # xóa space trước />
    s/^\s+|\s+$//g;          # trim
  '
}

minify_json() {
  perl -0777 -pe '
    s/\/\*.*?\*\///gs;
    s/\/\/[^\n]*//g;
    s/\s+/ /g;
    s/^\s+|\s+$//g;
  '
}

minify_xml() {
  perl -0777 -pe '
    s/<!--.*?-->//gs;
    s/>\s+</></g;
    s/\s+/ /g;
    s/^\s+|\s+$//g;
  '
}

find . -type f \( \
  -name "*.js"   -o -name "*.css"  -o -name "*.html" -o -name "*.htm" \
  -o -name "*.json" -o -name "*.xml" -o -name "*.csv" -o -name "*.txt" \
  -o -name "*.webmanifest" -o -name "*.map" \
  -o -name "*.jpg"  -o -name "*.jpeg" -o -name "*.png"  -o -name "*.gif" \
  -o -name "*.webp" -o -name "*.svg"  -o -name "*.ico"  -o -name "*.avif" \
  -o -name "*.bmp"  -o -name "*.tiff" \
  -o -name "*.mp4"  -o -name "*.mov"  -o -name "*.avi"  -o -name "*.mkv" \
  -o -name "*.webm" -o -name "*.mp3"  -o -name "*.wav"  -o -name "*.ogg" \
  -o -name "*.woff" -o -name "*.woff2" -o -name "*.ttf" -o -name "*.otf" \
  -o -name "*.eot"  -o -name "*.pdf" \
\) \
  | grep -vE '^\./(\.[^/]+|dist)/' \
  | while read -r file; do

    dest="$DIST_DIR/${file#./}"
    mkdir -p "$(dirname "$dest")"

    case "$file" in
      *.css)             minify_css  < "$file" > "$dest" ;;
      *.js)              minify_js   < "$file" > "$dest" ;;
      *.html|*.htm)      minify_html < "$file" > "$dest" ;;
      *.json|*.webmanifest) minify_json < "$file" > "$dest" ;;
      *.xml)             minify_xml  < "$file" > "$dest" ;;
      *)                 cp "$file" "$dest" ;;
    esac

    original=$(wc -c < "$file")
    minified=$(wc -c < "$dest")
    echo "✅ $file -> $dest (${original}B -> ${minified}B)"
done

echo "✨ Done!"