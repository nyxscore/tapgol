import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [form, setForm] = useState({
    id: "",
    password: "",
    phone: "",
    name: "",
    nickname: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("가입이 완료되었습니다!");
    navigate("/");
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 mt-8">
      <h2 className="text-3xl font-bold text-amber-700 mb-6 text-center">
        간편 가입
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-lg font-semibold mb-2" htmlFor="id">
            아이디
          </label>
          <input
            type="text"
            id="id"
            name="id"
            value={form.id}
            onChange={handleChange}
            className="w-full border border-amber-300 rounded-lg px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
            placeholder="아이디를 입력하세요"
          />
        </div>
        <div>
          <label
            className="block text-lg font-semibold mb-2"
            htmlFor="password"
          >
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border border-amber-300 rounded-lg px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
            placeholder="비밀번호를 입력하세요"
          />
        </div>
        <div>
          <label className="block text-lg font-semibold mb-2" htmlFor="phone">
            전화번호
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-amber-300 rounded-lg px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
            placeholder="010-1234-5678"
          />
        </div>
        <div>
          <label className="block text-lg font-semibold mb-2" htmlFor="name">
            이름
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-amber-300 rounded-lg px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
            placeholder="홍길동"
          />
        </div>
        <div>
          <label
            className="block text-lg font-semibold mb-2"
            htmlFor="nickname"
          >
            별명
          </label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            className="w-full border border-amber-300 rounded-lg px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
            placeholder="탑골짱"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-amber-700 text-white text-xl font-bold py-4 rounded-lg hover:bg-amber-800 transition-colors"
        >
          가입하기
        </button>
      </form>
    </div>
  );
};

export default Signup;
