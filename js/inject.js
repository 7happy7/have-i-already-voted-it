(()=>{
    var REG = {
        USER_BASE: '<span class="printuser (?:.*?WIKIDOT\\.page\\.listeners\\.userInfo\\((\\d+?)\\)[\\s\\S]*?return false;".*?>([^<>]*?)<\\/a><\\/span>|deleted" data-id="(.*?)">[\\s\\S]*?)\\s*?<span style="color:#777">([\\s\\S]*?)<\\/span>'
    }
    REG['USER'] = new RegExp(REG.USER_BASE);
    REG['USERS'] = new RegExp(REG.USER_BASE,'g');
    var decodeHTML = (str)=>{
        return str.replace(/&(?:([a-z]+?)|#(\d+?));/g, function(m, c, d) {
            return c ? ({
                "amp": "&",
                "lt": "<",
                "gt": ">",
                "quot": '"',
                "nbsp": " "
            }[c] || m) : d ? String.fromCharCode(d) : m;
        });
    }
    var cookie = (k)=>(document.cookie.split(/; ?/).find(v=>v.match(k + "=")) || "").split(k + "=").join("");
    var statsHandler = (stats)=>{
        var res = {
            error: true,
            raw: stats
        };
        switch (stats) {
        case "ok":
            res.desc = "正常にリクエストされました。";
            res.error = false;
            break;
        case "try_again":
            res.desc = "再試行してください。";
            res.retry = true;
            break;
        case "wrong_token7":
            res.desc = "トークン情報が不正です。ページをリロードしてください。";
            break;
        case "no_permission":
            res.desc = "ログインをしていないか、必要な権限がありません。";
            break;
        default:
            res.desc = "不明なエラー"
            break;
        }
        return res;
    }
    var postAjaxModCon = async function _f(payload={}, remind=false) {
        var token = cookie("wikidot_token7");
        var head = new Headers();
        head.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        head.append('Cookie', document.cookie);
        var obj = Object.assign({
            'wikidot_token7': token
        }, payload);
        var req = await fetch('/ajax-module-connector.php', {
            method: 'POST',
            body: Object.keys(obj).map(k=>`${k}=${encodeURIComponent(obj[k])}`).join('&'),
            headers: head
        });
        var res = await req.json();
        var stats = statsHandler(res.status);
        if (stats.retry) {
            return await _f(payload, remind);
        } else if (stats.error) {
            throw new Error(stats.desc);
        }
        if (remind) {
            console.log(stats.desc)
        }
        return res;
    };

    (async()=>{
        var a = await postAjaxModCon({
            'pageId': WIKIREQUEST.info.pageId,
            'moduleName': 'pagerate/WhoRatedPageModule'
        });
        var b = decodeHTML(a.body).match(REG.USERS);
        var c = b ? b.map(v=>{
            var _ = v.match(REG.USER);
            return {
                user_name: _[2],
                user_id: Number(_[1] || _[3]),
                vote_type: (_[4].trim() == "+")
            };
        }
        ) : [];
        var d = c.find(v=>v.user_id == WIKIREQUEST.userId);
        if (d) {
            for (var e of document.querySelectorAll('.rate-points')) {
                e.innerHTML = `(${d.vote_type ? '+' : '-'})` + e.innerHTML.trim();
            }
        }
    })();
})();
