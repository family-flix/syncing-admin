/**
 * @file 用户注册
 */
import { Button, Input } from "@/components/ui";
import { InputCore, ButtonCore } from "@/domains/ui";
import { ViewComponent } from "@/store/types";

export const RegisterPage: ViewComponent = (props) => {
  const { app, history } = props;
  const $email = new InputCore({
    defaultValue: "",
    placeholder: "请输入邮箱",
    onChange(v) {
      app.$user.inputEmail(v);
    },
  });
  const $pwd = new InputCore({
    defaultValue: "",
    type: "password",
    placeholder: "请输入密码",
    onChange(v) {
      app.$user.inputPassword(v);
    },
  });
  const $submit = new ButtonCore({
    async onClick() {
      $submit.setLoading(true);
      const r = await app.$user.register();
      $submit.setLoading(false);
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      app.tip({
        text: ["注册成功"],
      });
      history.push("root.home_layout.index");
    },
  });

  return (
    <div class="flex justify-center items-center h-screen bg-[#f8f9fa]">
      <form>
        <div class="p-12 rounded-xl w-[480px] bg-white">
          <h1 class="text-4xl text-center">管理员注册</h1>
          <div class="mt-16">
            <Input store={$email} />
          </div>
          <div class="mt-4">
            <Input store={$pwd} />
          </div>
          <div class="grid grid-cols-1 mt-4">
            <Button store={$submit} size="default">
              注册
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
