//下方註解題到的傳資料都只是html資料跟js的互相傳遞使用而已
window.onload = order_user_in_options
order_user = document.getElementsByClassName("order_user")
user_name = ["options", "峰", "堡", "宜", "漢", "秀", "萬", "靜", "星", "藍"]
function order_user_in_options(newd) {  //將預存好的arry[user_name]帶入html.options裡面
    if (newd != "newd") {
        for (x = 0; x < order_user.length; x++) { //此為刷空欄位,因為會添加新欄位所以要刷空,不然會一直累加重複的値
            document.getElementsByClassName("order_user")[x].innerHTML = "";
        }
        for (x = 0; x < order_user.length; x++) {
            for (y = 0; y < user_name.length; y++) {
                document.getElementsByClassName("order_user")[x].innerHTML += "<option value='" + user_name[y] + "'>" + user_name[y] + "</option>"
            }
        }
    } else {
        for (y = 0; y < user_name.length; y++) { //新增欄位時,選項也放上新資料
            document.getElementsByClassName("order_user")[order_user.length - 1].innerHTML += "<option value='" + user_name[y] + "'>" + user_name[y] + "</option>"
        }
    }
}
//#region 將LINE訊息貼上來 點擊按鈕將下方欄位填入資料 //
function auto_input_btn() {
    if (document.getElementById("in_input").value == '') {
        Swal.fire(
            '東西呢?',
            '請放入訊息好嗎?',
            'question'
          )
        return
    }
    try {
        order_db2 = [];
        console.log("🚀呼叫 => order_db2", order_db2)
        count = document.getElementById('in_input').value.split('\n').length - 1 //抓取斷行的次數 (知道有幾個人點餐)
        in_value = document.getElementById("in_input").value;
        food_name = document.getElementsByClassName("food_name")
        food_price_all = document.getElementsByClassName("food_price")
        options_name = document.getElementsByClassName("order_user")
        //#region 建立物件數量依照點餐人數 //
        for (x = 0; x < (count + 1); x++) {
            order_db2.push({ food_name: "", order_user: "", order_price: 0 });
        }
        //#endregion
        //#region 若點餐人數超過原有的欄位數，則新增到該人數
        if (in_value.length > order_db2.length) { //欄位大於點餐數則不用再次增加
            for (x = 0; x < (order_db2.length - 4); x++) {
                var box = document.querySelector(".total_block");
                var p = document.createElement('tr');
                p.innerHTML = '<tr class="tr_block"><td><img src="./imgs/for_order_food/001-burger.png"><input type="text" class="food_name" name="food" value=""></td><td><img src="imgs/for_order_food/new_card.png"><select class="order_user" class="order_user" name="order_user"></select></td><td><img src="imgs/for_order_food/003-dollar.png"><input type="text" class="food_price" name="food_price" placeholder="0"></td></tr>';
                box.parentNode.insertBefore(p, box);//在box之前添加元素
                order_user_in_options("newd")
            }
        }
        //#endregion
        //#region 將時間去除掉 時間格是固定為00:00 去除5個長度//
        arr = in_value.split("\n") // \n←空格的符號 依照空格轉存為陣列
        for (x = 0; x < arr.length; x++) {
            arr[x] = arr[x].substring(6)
        }
        //#endregion
        //#region //將資料整理到order_db 物件上
        for (x = 0; x < arr.length; x++) {
            new_arr = arr[x].split(' ')
            order_db2[x].order_user = new_arr[0]
            order_db2[x].food_name = new_arr[1]
            if (new_arr[2].slice(0, 1) == "$") {
                order_db2[x].order_price = new_arr[2].substring(1)
            } else {
                order_db2[x].order_price = new_arr[2]
            }
        }
        //#endregion
        //#region 將設定好物件放置到html上面
        for (x = 0; x < order_db2.length; x++) {
            food_name[x].value = order_db2[x].food_name
            options_name[x].options.add(new Option(order_db2[x].order_user, order_db2[x].order_user))
            options_name[x].options[10].selected = "true"
            food_price_all[x].value = order_db2[x].order_price
        }
        //#endregion
        go()
    } catch (err) {
        Swal.fire('','error')
        Swal.fire(
            'BB錯誤',
            '格式錯誤吧?看一下訊息格式',
            'error'
          )
    }
}

function go() {
    //#region  基本的宣告 //
    total = 0;
    table_input_Floor = 0;
    newarr = "";
    var food_number = 0 
    var order_db = [];
    var result = {};
    table_top_div = document.getElementById("table_top_div")
    food_name = document.getElementsByClassName("food_name")
    food_price_all = document.getElementsByClassName("food_price")
    options_name = document.getElementsByClassName("order_user")
    bot_table = document.getElementById("bot_table")
    back_to_input_food_name = document.getElementsByClassName("sorted_food")
    back_to_ipunt_food_amount = document.getElementsByClassName("sorted_amount")
    back_to_input_food_number = document.getElementById("sorted_number")
    
    //#endregion //
    //#region  10.先建立物件需要數量 20.再將訂餐table的點餐資訊存到obj裡面 //
    if (order_db.length != order_user.length) {
        for (x = 0; x < order_user.length; x++) {
            order_db.push({ food_name: "", order_user: "", order_price: 0 });
        }
    }
    for (x = 0; x < order_user.length; x++) { //將table資料存到obj理 
        newarr = food_name[x].value.replace(/\+/g, "<br>") //將+號便成,符號
        order_db[x].food_name = newarr
        order_db[x].order_price = food_price_all[x].value
        order_db[x].order_user = order_user[x].value
    }
    //#endregion //
    //#region 若填入的資料是最後一格時,則自動添加新欄位 //
    for (x = 0; x < food_name.length; x++) {
        if (food_name[x].value != "") {
            if (table_input_Floor < user_name.length - 2) {
                table_input_Floor++
                if (table_input_Floor == (food_name.length)) {
                    var box = document.querySelector(".total_block");
                    var p = document.createElement('tr');
                    p.innerHTML = '<tr class="tr_block"><td><img src="./imgs/for_order_food/001-burger.png"><input type="text" class="food_name" name="food" value=""></td><td><img src="imgs/for_order_food/new_card.png"><select class="order_user" class="order_user" name="order_user"></select></td><td><img src="imgs/for_order_food/003-dollar.png"><input type="text" class="food_price" name="food_price" placeholder="0"></td></tr>';
                    box.parentNode.insertBefore(p, box);//在box之前添加元素
                    order_user_in_options("newd")
                }
            }
        }
    }
    //#endregion
    //#region  選過的選項後不能再選擇//
    for (x = 0; x < options_name.length; x++) {
        for (y = 0; y < user_name.length; y++) {
            if (options_name[x].options[y].selected) {
                if (options_name[x].value != "options") {
                    for (z = 0; z < options_name.length; z++) {
                        options_name[z].options[y].disabled = "true"
                        options_name[z].options[y].style.color = "red"
                    }
                }
            }
        }
    }
    //#endregion
    //#region 將餐點名稱整理好丟到右邊 "點餐"用區塊 //,
    for (x = 0; x < food_name.length; x++) { //將table的値加入到字串裡並用+符號區分
        if (food_name[x].value == "") { } else {
            newarr += "+" + food_name[x].value
        }
    }
    newarr = newarr.substr(1, newarr.length) //將第一個+符號刪掉
    newarr = newarr.replace(/\+/g, ",") //將+號便成,符號
    arr = newarr.split(",")//再將,符號做為切割點轉為陣列
    arr.sort();//排序陣列   
    arr.forEach(function (item) {
        result[item] = result[item] ? result[item] + 1 : 1;
    });
    document.getElementById("order_sorted_table").innerHTML = "<tr><th>#</th><th>food_name</th><th>amount</th></tr>"
    //每次傳資料都須刷新成預設的樣子 不然會一直被累加上去
    for (x = 0; x < (Object.keys(result).length); x++) {
        document.getElementById("order_sorted_table").innerHTML += '<tr><td><img src="./imgs/for_order_food/number/00' + (x + 1) + '-number.png" style="width:35px"></td><td><input type="text" class="sorted_food" name="sorted_food" value="" disabled ></td><td><input type="text" class="sorted_amount" name="sorted_amount" value="" disabled style="width:80px;text-align: center;"></td></tr>'
    }
    //22-02-11 新增共有幾份餐點
    document.getElementById("order_sorted_table").innerHTML += '<tr><td><img src="./imgs/for_order_food/number/all.png" style="width:35px"></td><td></td><td><input type="text" id="sorted_number" value=""  disabled style="width:80px;text-align: center;"></td></tr>'
    //將資料丟到右上角訂餐系統上
    for (x = 0; x < (Object.keys(result).length); x++) {
        if (Object.keys(result)[x] != "") {
            back_to_input_food_name[x].value += (Object.keys(result)[x])
            back_to_ipunt_food_amount[x].value += (Object.values(result)[x])
            food_number += parseInt((Object.values(result)[x]))       
        }
    }
        //22-02-11 新增共有幾份餐點
    document.getElementById("sorted_number").value = food_number

    //#endregion //
    //#region  將左上點餐系統的小計 計算到total//
    for (x = 0; x < food_price_all.length; x++) { //計算餐點總價格
        if (isNaN(parseInt(food_price_all[x].value))) {
            total += 0
        } else {
            total += parseInt(food_price_all[x].value)
        }
    }
    document.getElementById("total_price").innerText = "$" + total;
    //#endregion //
    //#region 將點餐的人跟小計分別記到下方 是否繳錢表  //
    bot_table.innerHTML = '<tr><th>order_user</th><th>order_food</th><th>order_price</th><th>pay?</th><th>payTime</th></tr>';
    cat_int = 1;
    Object.entries(order_db).forEach(entry => {
        const [key, value] = entry;
        if (value.order_user != "options") {
            bot_table.innerHTML += '<tr><td>' + value.order_user + '</td><td>' + value.food_name + '</td><td>$' + value.order_price + '</td><td ><input type="checkbox" class="bot_pay_checkbox""></td><td class="bot_pay_time" id="cat' + cat_int + '"> <img src="./imgs/for_order_food/cat/kittycry.png" style="width:45px">尚未付款</td></tr>'
            cat_int++;
        }
    });
    //#endregion //
}
//#region 付錢並記錄時間 //
function pay_now() {
    bot_pay_checkbox = document.getElementsByClassName("bot_pay_checkbox")
    bot_pay_time = document.getElementsByClassName("bot_pay_time")
    var Today = new Date();
    now_time = Today.getHours() + "點" + Today.getMinutes() + "分"
    for (i = 0; i < bot_pay_checkbox.length; i++) {
        if (bot_pay_checkbox[i].checked == true) {
            //將勾選的class改名,就不會重複登記時間
            console.log(i)
            bot_pay_time[i].innerHTML = '<img src="./imgs/for_order_food/cat/klittywrite.png" style="width:45px" id="write_cat_run">';
            var eee = i;
            setTimeout(() => {
                document.getElementsByClassName("bot_pay_time")[eee].innerHTML = '<img src="./imgs/for_order_food/cat/klittywrite.png" style="width: 45px;" id="write_cat">' + now_time
                bot_pay_checkbox[eee].className = "bot_pay_over"
                bot_pay_time[eee].className = "bot_pay_time_over"
            }, 2000);
        }
    }
}


