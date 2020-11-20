# 遇到的问题及思考

* 在一个React项目中，需要刷新三级路由，以达到重新加载三极路由对应的组件的目的（刷新数据），下面简单描述一下对应的业务场景

![](https://tva1.sinaimg.cn/large/0081Kckwly1gkvlynnn3lj31gg0u07n5.jpg)

如上图所示，区域1是一个tabs，每个tab对应的是一个路由组件，切换tab的时候路由（三级路由）会发生改变，当我点击区域1的按钮，并在进行一些操作后，需要刷新tab的数据，由于我没有用到任何状态管理工具，
而且消息通知机制可维护性不高，所以想到了使用react router中的replace用当前的路径替换当前路径，相当于刷新路由，稍后我会解释一下是怎么实现的，在这之前，有些人肯定会有一些疑惑，我不是可以在父组件
传递参数或者从子组件拿到暴露的方法，来达到刷新的目的吗，先来看看对应的简易版代码：

```javascript

const tabs =  [
  {
    tab: '概览',
    key: 'overview',
  },          
  {
    tab: '常规佣金订单',
    key: 'normal',
  }
]

<PageContainer
  tabList={tabs}
>
  {children}
</PageContainer>

```

显而易见，我们都能看出来这是一个tabs，children对应相应路由的组件，这个对应关系我在路由配置文件中有定义，和这里要讨论的关系不大，就不贴出来了，只要知道点击某个tab的时候，有只无形的手会将对应的
路由组件插入进来，即children，然后载入tab内容区。到这里应该明白了，我们无法传递任何参数或者是获取children的实例。顺带说一下，我一开始不是使用三级路由的方式来加载子组件，而是维护一个map，存放了
key和组件的对应关系，如下所示：


```javascript

const tabs =  [
  {
    tab: '概览',
    key: 'overview',
  },          
  {
    tab: '常规佣金订单',
    key: 'normal',
  }
]

const mapComponent = {
  overview: <Overview />,
  normal: <Normal />
}

// activeKey: overview || normal
<PageContainer
  tabList={tabs}
  tabActiveKey={activeKey}
>
  {mapComponent[activeKey]}
</PageContainer>


```

这种实现方式对子组件的控制就强多了，但是有一个问题，在切换tab的时候，内容区也会有一个切换过程，在数据量大了之后，会出现肉眼可见的变化，造成数据错乱的错觉，为了优化这个问题，就有了这点思考。好，接下
来看看我是怎么用replace实现的，以下是模拟reload的代码实现：

```javascript

 const reloadPage = () => {
    let search = history.location.search;
    const timestampIndex = search.indexOf('&_timestamp');

    search = timestampIndex > -1 ? search.substr(0, timestampIndex) : search.substr(0);

    const url = `${history.location.pathname}${search}&_timestamp=${Date.now()}`;
    history.replace(url);
  };

```

主要是拿到当前路由及其参数，在最后拼上一个时间戳，当时间戳变化，说明就是刷新当前路由了，当然如果不作任何处理，只会在第一次时会重新加载组件，因为只是参数变了，路由没有发生改变，react不会作任何更新。在
Overview内有一个useEffect，内部发起了一个请求数据的接口，看以下代码：

```
// Overview.tsx

...

useEffect(() => {
 fetchSomething();
}, [_timestamp]);

...

```

可以看到useEffect依赖了_timestamp，_timestamp是我们刚才拼到地址栏中的，我们可以拿到，这段代码的意思是当_timestamp发生变化时，执行回调，即fetchSomething();到这里，我们就完成了刷新路由，
再更新数据的目的。
